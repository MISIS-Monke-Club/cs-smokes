-- name: GetHealthValue :one
select 1::int as value;

-- name: GetUserByID :one
select user_id, username, email, password_hash, first_name, last_name, avatar_url, steam_link, tg_id, is_banned
from users
where user_id = $1;

-- name: ListUsers :many
select user_id, username, email, first_name, last_name, avatar_url, steam_link, tg_id, is_banned
from users
order by user_id;

-- name: FindUserByTelegramID :one
select user_id, username, email, password_hash, first_name, last_name, avatar_url, steam_link, tg_id, is_banned
from users
where tg_id = $1;

-- name: FindUserByUsernameOrEmail :one
select user_id, username, email, password_hash, first_name, last_name, avatar_url, steam_link, tg_id, is_banned
from users
where username = $1 or email = $1;

-- name: CreateUser :one
insert into users (username, email, password_hash, first_name, last_name, avatar_url, steam_link, tg_id, is_banned)
values ($1, $2, $3, $4, $5, $6, $7, $8, false)
returning user_id, username, email, password_hash, first_name, last_name, avatar_url, steam_link, tg_id, is_banned;

-- name: UpdateUser :one
update users
set username = $2, email = $3, password_hash = $4, first_name = $5, last_name = $6, avatar_url = $7, steam_link = $8, updated_at = now()
where user_id = $1
returning user_id, username, email, password_hash, first_name, last_name, avatar_url, steam_link, tg_id, is_banned;

-- name: DeleteUser :exec
delete from users
where user_id = $1;

-- name: ListUserRoleCodes :many
select ar.code
from user_admin_roles uar
join admin_roles ar on ar.role_id = uar.role_id
where uar.user_id = $1
order by ar.code;

-- name: DeleteUserRoles :exec
delete from user_admin_roles
where user_id = $1;

-- name: AddUserRoleByCode :exec
insert into user_admin_roles (user_id, role_id)
select $1, role_id
from admin_roles
where code = $2
on conflict do nothing;

-- name: ListGrenadeClasses :many
select grenade_class_id, name, description, price
from grenade_classes
order by grenade_class_id;

-- name: GetGrenadeClassByID :one
select grenade_class_id, name, description, price
from grenade_classes
where grenade_class_id = $1;

-- name: CreateGrenadeClass :one
insert into grenade_classes (name, description, price)
values ($1, $2, $3)
returning grenade_class_id, name, description, price;

-- name: UpdateGrenadeClass :one
update grenade_classes
set name = $2, description = $3, price = $4, updated_at = now()
where grenade_class_id = $1
returning grenade_class_id, name, description, price;

-- name: DeleteGrenadeClass :exec
delete from grenade_classes
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

-- name: ListLineups :many
select grenade_id, map_id, user_id, grenade_class_id, link_to_video, title, description, is_approved, views, preview_image_path, created_at
from lineups
order by grenade_id;

-- name: GetLineupByID :one
select grenade_id, map_id, user_id, grenade_class_id, link_to_video, title, description, is_approved, views, preview_image_path, created_at
from lineups
where grenade_id = $1;

-- name: CreateLineup :one
insert into lineups (map_id, user_id, grenade_class_id, link_to_video, title, description, is_approved, views, preview_image_path)
values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
returning grenade_id, map_id, user_id, grenade_class_id, link_to_video, title, description, is_approved, views, preview_image_path, created_at;

-- name: UpdateLineup :one
update lineups
set map_id = $2, user_id = $3, grenade_class_id = $4, link_to_video = $5, title = $6, description = $7, is_approved = $8, views = $9, preview_image_path = $10, updated_at = now()
where grenade_id = $1
returning grenade_id, map_id, user_id, grenade_class_id, link_to_video, title, description, is_approved, views, preview_image_path, created_at;

-- name: ChangeLineupGrenadeClass :one
update lineups
set grenade_class_id = $2, updated_at = now()
where grenade_id = $1
returning grenade_id, map_id, user_id, grenade_class_id, link_to_video, title, description, is_approved, views, preview_image_path, created_at;

-- name: DeleteLineup :exec
delete from lineups
where grenade_id = $1;

-- name: ListProperties :many
select property_id, name, value
from properties
order by property_id;

-- name: GetPropertyByID :one
select property_id, name, value
from properties
where property_id = $1;

-- name: ListLineupProperties :many
select p.property_id, lp.grenade_id, p.name, p.value
from lineup_properties lp
join properties p on p.property_id = lp.property_id
where sqlc.narg('grenade_id')::int is null or lp.grenade_id = sqlc.narg('grenade_id')::int
order by p.property_id;

-- name: CreateProperty :one
insert into properties (name, value)
values ($1, $2)
returning property_id, name, value;

-- name: UpdateProperty :one
update properties
set name = $2, value = $3, updated_at = now()
where property_id = $1
returning property_id, name, value;

-- name: DeleteProperty :exec
delete from properties
where property_id = $1;

-- name: CreateLineupProperty :exec
insert into lineup_properties (property_id, grenade_id)
values ($1, $2);

-- name: DeleteLineupProperty :exec
delete from lineup_properties
where property_id = $1 and grenade_id = $2;

-- name: CreateFavorite :exec
insert into favorites (user_id, grenade_id)
values ($1, $2);

-- name: DeleteFavorite :exec
delete from favorites
where user_id = $1 and grenade_id = $2;

-- name: ListFavoriteLineupIDsByUser :many
select grenade_id
from favorites
where user_id = $1
order by created_at;

-- name: ListPullRequests :many
select id, lineup_id, creator_id, approver_id, status, created_at, closed_at
from pull_requests
order by id;

-- name: GetPullRequestByID :one
select id, lineup_id, creator_id, approver_id, status, created_at, closed_at
from pull_requests
where id = $1;

-- name: GetPullRequestByLineupID :one
select id, lineup_id, creator_id, approver_id, status, created_at, closed_at
from pull_requests
where lineup_id = $1
order by id desc
limit 1;

-- name: CreatePullRequest :one
insert into pull_requests (lineup_id, creator_id, status)
values ($1, $2, 'OPEN')
returning id, lineup_id, creator_id, approver_id, status, created_at, closed_at;

-- name: UpdatePullRequestStatus :one
update pull_requests
set status = $2, approver_id = $3, closed_at = case when $2 = 'CLOSED' then now() else closed_at end, updated_at = now()
where id = $1
returning id, lineup_id, creator_id, approver_id, status, created_at, closed_at;

-- name: DeletePullRequest :exec
delete from pull_requests
where id = $1;

-- name: ListCommentsByPullRequest :many
select id, pull_request_id, author_id, text, created_at
from comments
where pull_request_id = $1
order by created_at;

-- name: GetCommentByID :one
select id, pull_request_id, author_id, text, created_at
from comments
where id = $1;

-- name: CreateComment :one
insert into comments (pull_request_id, author_id, text)
values ($1, $2, $3)
returning id, pull_request_id, author_id, text, created_at;

-- name: UpdateComment :one
update comments
set text = $2
where id = $1
returning id, pull_request_id, author_id, text, created_at;

-- name: DeleteComment :exec
delete from comments
where id = $1;
