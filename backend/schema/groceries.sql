create table items (
	id integer primary key,
	name text unique collate nocase,
	data text
);
create table categories (
	id integer primary key,
	name text unique collate nocase,
	priority integer
);
