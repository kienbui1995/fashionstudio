-- Public lookbook shares: a saved look (PNG/JPEG data URL) that anyone with
-- the link can view at /l/<id>. Rows are scoped by user_id for ownership.
create table if not exists looks (
  id text primary key,
  user_id text not null,
  shop_name text,
  product_name text,
  price_vnd bigint,
  caption text,
  image_data text not null,
  created_at timestamptz not null default now()
);

create index if not exists looks_user_id_idx on looks (user_id);
