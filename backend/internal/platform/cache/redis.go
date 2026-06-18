package cache

import (
	"context"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

type RedisStore struct {
	client *goredis.Client
}

func NewRedisStore(client *goredis.Client) RedisStore {
	return RedisStore{client: client}
}

func (s RedisStore) Get(ctx context.Context, key string) ([]byte, error) {
	value, err := s.client.Get(ctx, key).Bytes()
	if err == goredis.Nil {
		return nil, nil
	}
	return value, err
}

func (s RedisStore) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	return s.client.Set(ctx, key, value, ttl).Err()
}

func (s RedisStore) DeletePrefix(ctx context.Context, prefix string) error {
	iter := s.client.Scan(ctx, 0, prefix+"*", 100).Iterator()
	keys := []string{}
	for iter.Next(ctx) {
		keys = append(keys, iter.Val())
	}
	if err := iter.Err(); err != nil {
		return err
	}
	if len(keys) == 0 {
		return nil
	}
	return s.client.Del(ctx, keys...).Err()
}
