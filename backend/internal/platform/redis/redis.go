package redis

import goredis "github.com/redis/go-redis/v9"

func NewClient(addr string, password string) *goredis.Client {
	return goredis.NewClient(&goredis.Options{
		Addr:     addr,
		Password: password,
	})
}
