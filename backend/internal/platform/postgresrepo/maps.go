package postgresrepo

import (
	"context"
	"strings"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/db/generated"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/maps"
)

func (s *Store) ListMaps(ctx context.Context, filter maps.Filter) ([]maps.Map, error) {
	rows, err := s.q.ListMaps(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]maps.Map, 0, len(rows))
	for _, row := range rows {
		item := mapFromList(row)
		if filter.IsEsportsPool != nil && item.IsEsportsPool != *filter.IsEsportsPool {
			continue
		}
		if filter.Query != "" && !strings.Contains(strings.ToLower(item.Name), strings.ToLower(filter.Query)) {
			continue
		}
		out = append(out, item)
	}
	sortMaps(out, filter.Ordering)
	return out, nil
}

func (s *Store) CreateMap(ctx context.Context, input maps.Input) (maps.Map, error) {
	if input.Name == "" {
		return maps.Map{}, maps.ValidationError{Fields: []string{"name"}}
	}
	row, err := s.q.CreateMap(ctx, generated.CreateMapParams{
		Name:          input.Name,
		Link:          textValue(input.Link),
		IsEsportsPool: boolValue(input.IsEsportsPool, false),
		ImagePath:     textValue(input.ImagePath),
	})
	if err != nil {
		return maps.Map{}, err
	}
	return mapFromRecord(row), nil
}

func (s *Store) GetMap(ctx context.Context, id int) (maps.Map, error) {
	row, err := s.q.GetMapByID(ctx, int32(id))
	if err != nil {
		return maps.Map{}, mapNotFound(err, maps.ErrNotFound)
	}
	return mapFromGet(row), nil
}

func (s *Store) ReplaceMap(ctx context.Context, id int, input maps.Input) (maps.Map, error) {
	return s.updateMap(ctx, id, input, false)
}

func (s *Store) PatchMap(ctx context.Context, id int, input maps.Input) (maps.Map, error) {
	return s.updateMap(ctx, id, input, true)
}

func (s *Store) DeleteMap(ctx context.Context, id int) error {
	if _, err := s.q.GetMapByID(ctx, int32(id)); err != nil {
		return mapNotFound(err, maps.ErrNotFound)
	}
	return s.q.DeleteMap(ctx, int32(id))
}

func (s *Store) updateMap(ctx context.Context, id int, input maps.Input, merge bool) (maps.Map, error) {
	if merge {
		current, err := s.q.GetMapByID(ctx, int32(id))
		if err != nil {
			return maps.Map{}, mapNotFound(err, maps.ErrNotFound)
		}
		if input.Name == "" {
			input.Name = current.Name
		}
		if input.Link == nil {
			input.Link = textPtr(current.Link)
		}
		if input.IsEsportsPool == nil {
			value := current.IsEsportsPool
			input.IsEsportsPool = &value
		}
		if input.ImagePath == nil {
			input.ImagePath = textPtr(current.ImagePath)
		}
	}
	row, err := s.q.UpdateMap(ctx, generated.UpdateMapParams{
		MapID:         int32(id),
		Name:          input.Name,
		Link:          textValue(input.Link),
		IsEsportsPool: boolValue(input.IsEsportsPool, false),
		ImagePath:     textValue(input.ImagePath),
	})
	if err != nil {
		return maps.Map{}, mapNotFound(err, maps.ErrNotFound)
	}
	return mapFromUpdate(row), nil
}
