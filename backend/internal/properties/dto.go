package properties

type Property struct {
	PropertyID int
	Name       string
	Value      *string
}

type PropertyRelation struct {
	PropertyID int
	GrenadeID  int
	Name       string
	Value      *string
}

type PropertyDTO struct {
	PropertyID int     `json:"property_id"`
	Name       string  `json:"name"`
	Value      *string `json:"value"`
}

type PropertyRelationDTO struct {
	PropertyID int     `json:"property_id"`
	GrenadeID  int     `json:"grenade_id"`
	Name       string  `json:"name"`
	Value      *string `json:"value"`
}

type Input struct {
	Name  string  `json:"name"`
	Value *string `json:"value"`
}

func ToDTO(property Property) PropertyDTO {
	return PropertyDTO{PropertyID: property.PropertyID, Name: property.Name, Value: property.Value}
}

func ToRelationDTO(relation PropertyRelation) PropertyRelationDTO {
	return PropertyRelationDTO{
		PropertyID: relation.PropertyID,
		GrenadeID:  relation.GrenadeID,
		Name:       relation.Name,
		Value:      relation.Value,
	}
}
