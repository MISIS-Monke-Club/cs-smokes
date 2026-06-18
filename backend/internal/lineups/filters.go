package lineups

import "net/url"

type Filter struct {
	IsApproved       *bool
	Ordering         string
	Query            string
	ByUserName       string
	CreatorIDIgnored string
}

func ParseFilter(values url.Values) Filter {
	var approved *bool
	switch values.Get("is_approved") {
	case "true":
		value := true
		approved = &value
	case "false":
		value := false
		approved = &value
	}
	return Filter{
		IsApproved: approved,
		Ordering:   values.Get("ordering"),
		Query:      values.Get("query"),
		ByUserName: values.Get("by_user_name"),
	}
}
