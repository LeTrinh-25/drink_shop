BEGIN;

WITH source(name, description) AS (
  VALUES
    ('Cà phê', 'Cà phê và đồ uống cà phê.'),
    ('Nước suối', 'Nước uống đóng chai.'),
    ('Nước ép', 'Nước ép trái cây.'),
    ('Trà & trà sữa', 'Các loại trà và trà sữa.'),
    ('Nước ngọt', 'Nước giải khát có gas.'),
    ('Sữa', 'Sữa và thức uống từ sữa.'),
    ('Bia', 'Các loại bia đóng chai và lon.'),
    ('Rượu', 'Rượu vang và rượu nhẹ.')
)
INSERT INTO categories (name, description)
SELECT source.name, source.description
FROM source
WHERE NOT EXISTS (
  SELECT 1 FROM categories existing WHERE existing.name = source.name
);

WITH source(name, price, image, description, stock, category_name) AS (
  VALUES
    ('7Up', 12000, '/images/7up.jpg', 'Nước ngọt có gas vị chanh tươi mát.', 30, 'Nước ngọt'),
    ('Aquafina 500ml', 8000, '/images/aquafina.jpg', 'Nước uống tinh khiết đóng chai 500ml.', 30, 'Nước suối'),
    ('Bạc xỉu', 28000, '/images/bac-xiu.jpg', 'Cà phê sữa dịu nhẹ, thơm béo.', 30, 'Cà phê'),
    ('Cà phê đen', 22000, '/images/cafe-den.jpg', 'Cà phê đen đậm vị, thơm đặc trưng.', 30, 'Cà phê'),
    ('Cà phê sữa', 26000, '/images/cafe-sua.jpg', 'Cà phê hòa quyện cùng sữa ngọt béo.', 30, 'Cà phê'),
    ('Coca-Cola', 12000, '/images/coca.jpg', 'Nước ngọt có gas Coca-Cola mát lạnh.', 30, 'Nước ngọt'),
    ('Nước ép cam', 30000, '/images/ep-cam.jpg', 'Nước ép cam vị chua ngọt tự nhiên.', 30, 'Nước ép'),
    ('Nước ép dứa', 28000, '/images/ep-dua.jpg', 'Nước ép dứa thơm ngon, giải khát.', 30, 'Nước ép'),
    ('Nước ép ổi', 28000, '/images/ep-oi.jpg', 'Nước ép ổi thơm nhẹ, vị ngọt thanh.', 30, 'Nước ép'),
    ('Fanta cam', 12000, '/images/fanta.jpg', 'Nước ngọt có gas vị cam.', 30, 'Nước ngọt'),
    ('Heineken', 22000, '/images/heineken.jpg', 'Bia Heineken ướp lạnh.', 30, 'Bia'),
    ('Bia Huda', 16000, '/images/huda.jpg', 'Bia Huda đậm đà, mát lạnh.', 30, 'Bia'),
    ('Bia Larue', 16000, '/images/larue.jpg', 'Bia Larue sảng khoái.', 30, 'Bia'),
    ('LaVie 500ml', 8000, '/images/lavie.jpg', 'Nước khoáng thiên nhiên đóng chai 500ml.', 30, 'Nước suối'),
    ('Pepsi', 12000, '/images/pepsi.jpg', 'Nước ngọt có gas Pepsi mát lạnh.', 30, 'Nước ngọt'),
    ('Rượu vang đỏ', 280000, '/images/ruou-vang.jpg', 'Rượu vang đỏ dùng trong những dịp đặc biệt.', 30, 'Rượu'),
    ('Bia Saigon', 16000, '/images/saigon.jpg', 'Bia Saigon ướp lạnh, dễ uống.', 30, 'Bia'),
    ('Soju', 95000, '/images/soju.jpg', 'Rượu Soju phong cách Hàn Quốc.', 30, 'Rượu'),
    ('Sữa socola', 18000, '/images/sua-socola.jpg', 'Sữa vị socola thơm ngon.', 30, 'Sữa'),
    ('Sữa tươi', 16000, '/images/sua-tuoi.jpg', 'Sữa tươi mát lành, dễ uống.', 30, 'Sữa'),
    ('Trà chanh', 22000, '/images/tra-chanh.jpg', 'Trà chanh chua ngọt, giải khát.', 30, 'Trà & trà sữa'),
    ('Trà đào', 28000, '/images/tra-dao.jpg', 'Trà đào thơm dịu, vị ngọt thanh.', 30, 'Trà & trà sữa'),
    ('Trà sữa', 32000, '/images/tra-sua.jpg', 'Trà sữa béo thơm, pha mới mỗi ngày.', 30, 'Trà & trà sữa'),
    ('Tiger', 19000, '/images/tiger.jpg', 'Bia Tiger ướp lạnh.', 30, 'Bia')
)
INSERT INTO products (name, price, image, description, stock, "isActive", category_id)
SELECT source.name, source.price, source.image, source.description, source.stock, TRUE, category.id
FROM source
JOIN categories category ON category.name = source.category_name
WHERE NOT EXISTS (
  SELECT 1 FROM products existing WHERE existing.name = source.name
);

COMMIT;
