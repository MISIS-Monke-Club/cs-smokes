package maps

import "github.com/MISIS-Monke-Club/cs-smokes/backend/internal/media"

type Map struct {
	MapID         int
	Name          string
	Link          *string
	IsEsportsPool bool
	ImagePath     *string
	MapLineups    []any
}

type MapDTO struct {
	MapID         int     `json:"map_id"`
	Name          string  `json:"name"`
	Link          *string `json:"link"`
	IsEsportsPool bool    `json:"is_esports_pool"`
	ImageLink     *string `json:"image_link"`
}

type MapDetailDTO struct {
	MapDTO
	MapLineups []any `json:"map_lineups"`
}

type Filter struct {
	Ordering      string
	Query         string
	IsEsportsPool *bool
}

type Input struct {
	Name          string
	Link          *string
	IsEsportsPool bool
	ImagePath     *string
}

func ToDTO(baseURL string, item Map) MapDTO {
	return MapDTO{
		MapID:         item.MapID,
		Name:          item.Name,
		Link:          item.Link,
		IsEsportsPool: item.IsEsportsPool,
		ImageLink:     media.PublicURL(baseURL, item.ImagePath),
	}
}

func ToDetailDTO(baseURL string, item Map) MapDetailDTO {
	return MapDetailDTO{MapDTO: ToDTO(baseURL, item), MapLineups: item.MapLineups}
}
