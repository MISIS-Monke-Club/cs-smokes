package lineups

import (
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/grenadeclasses"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/media"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
)

const WaitingForCreation = "WAITING FOR CREATION"

type Lineup struct {
	UserID           int
	GrenadeID        int
	MapID            int
	LinkToVideo      *string
	Creator          users.User
	CreatedAt        string
	Title            string
	Description      *string
	IsApproved       bool
	IsFavorite       bool
	Views            int
	PreviewImagePath *string
	GrenadeClass     grenadeclasses.GrenadeClass
	PropertyList     []PropertyInline
	Request          RequestStatus
}

type RequestStatus struct {
	RequestID *int
	Status    string
}

type PropertyInline struct {
	PropertyID int
	Name       string
	Value      *string
}

type RequestStatusDTO struct {
	RequestID *int   `json:"request_id"`
	Status    string `json:"status"`
}

type PropertyInlineDTO struct {
	PropertyID int     `json:"property_id"`
	Name       string  `json:"name"`
	Value      *string `json:"value"`
}

type LineupDTO struct {
	UserID           int                            `json:"user_id"`
	GrenadeID        int                            `json:"grenade_id"`
	MapID            int                            `json:"map_id"`
	LinkToVideo      *string                        `json:"link_to_video"`
	Creator          users.ProfileDTO               `json:"creator"`
	CreatedAt        string                         `json:"created_at"`
	Title            string                         `json:"title"`
	Description      *string                        `json:"description"`
	IsApproved       bool                           `json:"is_approved"`
	IsFavorite       bool                           `json:"is_favorite"`
	Views            int                            `json:"views"`
	PreviewImageLink *string                        `json:"preview_image_link"`
	GrenadeClass     grenadeclasses.GrenadeClassDTO `json:"grenade_class"`
	PropertyList     []PropertyInlineDTO            `json:"property_list"`
	Request          RequestStatusDTO               `json:"request"`
}

type Input struct {
	MapID            int
	LinkToVideo      *string
	UserID           int
	Title            string
	Description      *string
	IsApproved       bool
	Views            int
	PreviewImagePath *string
	GrenadeClassID   int
}

func ToDTO(baseURL string, lineup Lineup) LineupDTO {
	properties := make([]PropertyInlineDTO, len(lineup.PropertyList))
	for i, property := range lineup.PropertyList {
		properties[i] = PropertyInlineDTO{
			PropertyID: property.PropertyID,
			Name:       property.Name,
			Value:      property.Value,
		}
	}
	request := lineup.Request
	if request.Status == "" {
		request.Status = WaitingForCreation
	}
	return LineupDTO{
		UserID:           lineup.UserID,
		GrenadeID:        lineup.GrenadeID,
		MapID:            lineup.MapID,
		LinkToVideo:      lineup.LinkToVideo,
		Creator:          users.ToProfileDTO(lineup.Creator),
		CreatedAt:        lineup.CreatedAt,
		Title:            lineup.Title,
		Description:      lineup.Description,
		IsApproved:       lineup.IsApproved,
		IsFavorite:       lineup.IsFavorite,
		Views:            lineup.Views,
		PreviewImageLink: media.PublicURL(baseURL, lineup.PreviewImagePath),
		GrenadeClass:     grenadeclasses.ToDTO(lineup.GrenadeClass),
		PropertyList:     properties,
		Request: RequestStatusDTO{
			RequestID: request.RequestID,
			Status:    request.Status,
		},
	}
}
