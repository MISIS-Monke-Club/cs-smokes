-- name: GetHealthValue :one
select 1::int as value;

-- name: GetUserByID :one
select user_id, username, email, first_name, last_name, avatar_url, steam_link, tg_id, is_banned
from users
where user_id = $1;

-- name: ListUsers :many
select user_id, username, email, first_name, last_name, avatar_url, steam_link, tg_id, is_banned
from users
order by user_id;

-- name: ListGrenadeClasses :many
select grenade_class_id, name, description, price
from grenade_classes
order by grenade_class_id;

-- name: GetGrenadeClassByID :one
select grenade_class_id, name, description, price
from grenade_classes
where grenade_class_id = $1;

-- name: ListMaps :many
select m.map_id, m.name, m.link, m.is_esports_pool, m.image_path, count(l.grenade_id)::int as quantity
from maps m
left join lineups l on l.map_id = m.map_id
group by m.map_id
order by m.map_id;

-- name: GetMapByID :one
select m.map_id, m.name, m.link, m.is_esports_pool, m.image_path, count(l.grenade_id)::int as quantity
from maps m
left join lineups l on l.map_id = m.map_id
where m.map_id = $1
group by m.map_id;

-- name: CreateMap :one
insert into maps (name, link, is_esports_pool, image_path)
values ($1, $2, $3, $4)
returning map_id, name, link, is_esports_pool, image_path;

-- name: UpdateMap :one
update maps
set name = $2, link = $3, is_esports_pool = $4, image_path = $5, updated_at = now()
where map_id = $1
returning map_id, name, link, is_esports_pool, image_path;

-- name: DeleteMap :exec
delete from maps
where map_id = $1;
