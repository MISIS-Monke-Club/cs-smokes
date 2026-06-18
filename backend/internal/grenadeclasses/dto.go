package grenadeclasses

type GrenadeClass struct {
	GrenadeClassID int
	Name           string
	Description    *string
	Price          int
}

type GrenadeClassDTO struct {
	GrenadeClassID int     `json:"grenade_class_id"`
	Name           string  `json:"name"`
	Description    *string `json:"description"`
	Price          int     `json:"price"`
}

type Input struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
	Price       int     `json:"price"`
}

func ToDTO(class GrenadeClass) GrenadeClassDTO {
	return GrenadeClassDTO{
		GrenadeClassID: class.GrenadeClassID,
		Name:           class.Name,
		Description:    class.Description,
		Price:          class.Price,
	}
}
