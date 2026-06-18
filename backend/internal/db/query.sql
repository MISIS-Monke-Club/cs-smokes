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
