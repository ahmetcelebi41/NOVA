-- NOVA production portfolio demo data.
-- Apply only to an empty nova-prod database after verifying all business table counts are zero.
PRAGMA foreign_keys = ON;

INSERT INTO settings (
  id, business_name, email, phone, address,
  delivery_fee_in_kurus, minimum_order_amount_in_kurus,
  delivery_enabled, pickup_enabled, created_at, updated_at
) VALUES (
  1, 'NOVA Market', 'merhaba@novamarket.example', '+90 212 555 01 39',
  'Kadıköy, İstanbul', 4990, 19990, 1, 1,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-180 days'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);

INSERT INTO products (
  id, name, sku, category, description, price_in_kurus,
  stock_quantity, low_stock_threshold, image_url, publication_status,
  created_at, updated_at
) VALUES
  (1, 'Anadolu Filtre Kahve 250 g', 'KHV-001', 'Kahve', 'Dengeli içimli, orta kavrum filtre kahve.', 28990, 24, 6, NULL, 'active', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-150 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour')),
  (2, 'Geleneksel Türk Kahvesi 250 g', 'KHV-002', 'Kahve', 'İnce öğütülmüş, yoğun aromalı Türk kahvesi.', 19990, 5, 6, NULL, 'active', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-145 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 hours')),
  (3, 'El Yapımı Seramik Kupa', 'AKS-001', 'Aksesuar', 'Mat sırlı, 320 ml seramik kupa.', 34990, 0, 3, NULL, 'active', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-140 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days')),
  (4, 'Çelik Termos 750 ml', 'AKS-002', 'Aksesuar', 'Çift katmanlı, sızdırmaz çelik termos.', 79990, 8, 3, NULL, 'active', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-135 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 hours')),
  (5, 'French Press 600 ml', 'EKP-001', 'Ekipman', 'Isıya dayanıklı cam French press.', 64990, 3, 4, NULL, 'active', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-130 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 hours')),
  (6, 'Cam Demlik 800 ml', 'EKP-002', 'Ekipman', 'Paslanmaz filtreli borosilikat cam demlik.', 54990, 12, 4, NULL, 'active', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-125 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-4 hours')),
  (7, 'Bitki Çayı Seçki Kutusu', 'CAY-001', 'Çay', 'Altı farklı harmandan oluşan seçki kutusu.', 42990, 2, 3, NULL, 'active', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-120 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 hours')),
  (8, 'El Yapımı Çikolata Kutusu', 'ATI-001', 'Atıştırmalık', 'Karışık dolgulu 12 parça çikolata.', 37990, 18, 5, NULL, 'active', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-115 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour')),
  (9, 'Kraft Hediye Paketi', 'AMB-001', 'Ambalaj', 'Kurdeleli geri dönüştürülebilir hediye paketi.', 7990, 40, 10, NULL, 'active', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-110 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 hours')),
  (10, 'NOVA Bez Çanta', 'AKS-003', 'Aksesuar', 'Pamuklu, uzun saplı günlük bez çanta.', 14990, 0, 4, NULL, 'inactive', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-105 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-95 days', '-2 hours')),
  (11, 'Espresso Blend 500 g', 'KHV-003', 'Kahve', 'Çikolata ve fındık notalı espresso harmanı.', 45990, 14, 5, NULL, 'active', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-100 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-3 hours')),
  (12, 'Soğuk Demleme Şişesi', 'EKP-003', 'Ekipman', 'Filtreli 650 ml cold brew şişesi.', 39990, 7, 2, NULL, 'active', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-90 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days', '-4 hours'));

INSERT INTO customers (
  id, name, phone, email, address, created_at, updated_at
) VALUES
  (1, 'Ayşe Yılmaz', '+90 532 111 22 33', 'ayse.yilmaz@example.com', 'Moda, Kadıköy, İstanbul', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-160 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour')),
  (2, 'Mehmet Demir', '+90 533 222 33 44', 'mehmet.demir@example.com', 'Beşiktaş, İstanbul', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-120 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 hours')),
  (3, 'Zeynep Kaya', '+90 534 333 44 55', 'zeynep.kaya@example.com', 'Nilüfer, Bursa', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-90 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 hours')),
  (4, 'Can Arslan', '+90 535 444 55 66', 'can.arslan@example.com', 'Çankaya, Ankara', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-75 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 hours')),
  (5, 'Elif Şahin', '+90 536 555 66 77', 'elif.sahin@example.com', 'Karşıyaka, İzmir', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-60 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 hours')),
  (6, 'Burak Aydın', '+90 537 666 77 88', 'burak.aydin@example.com', 'Tepebaşı, Eskişehir', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-40 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-4 hours')),
  (7, 'Derya Koç', '+90 538 777 88 99', 'derya.koc@example.com', 'Muratpaşa, Antalya', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-35 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days', '-3 hours')),
  (8, 'Mert Çetin', '+90 539 888 99 00', 'mert.cetin@example.com', 'Konak, İzmir', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-20 days'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 days', '-3 hours'));

INSERT INTO orders (
  id, order_number, customer_id,
  customer_name_snapshot, customer_phone_snapshot, customer_email_snapshot,
  delivery_method, delivery_address_snapshot, delivery_date,
  delivery_start_time, delivery_end_time, notes,
  subtotal_in_kurus, delivery_fee_in_kurus, total_in_kurus,
  status, created_at, updated_at
) VALUES
  (1, 'NOVA-000001', 1, 'Ayşe Yılmaz', '+90 532 111 22 33', 'ayse.yilmaz@example.com', 'delivery', 'Moda, Kadıköy, İstanbul', date('now'), '14:00', '16:00', 'Kapıya bırakılabilir.', 95970, 4990, 100960, 'completed', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-6 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 hours')),
  (2, 'NOVA-000002', 2, 'Mehmet Demir', '+90 533 222 33 44', 'mehmet.demir@example.com', 'pickup', NULL, date('now'), '17:00', '18:00', NULL, 27980, 0, 27980, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 hours')),
  (3, 'NOVA-000003', 3, 'Zeynep Kaya', '+90 534 333 44 55', 'zeynep.kaya@example.com', 'delivery', 'Nilüfer, Bursa', date('now', '+1 day'), '10:00', '12:00', 'Teslimat öncesi arayınız.', 79990, 4990, 84980, 'preparing', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-4 hours')),
  (4, 'NOVA-000004', 4, 'Can Arslan', '+90 535 444 55 66', 'can.arslan@example.com', 'delivery', 'Çankaya, Ankara', date('now', '+1 day'), '13:00', '15:00', NULL, 93970, 4990, 98960, 'ready_for_delivery', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 hours')),
  (5, 'NOVA-000005', 5, 'Elif Şahin', '+90 536 555 66 77', 'elif.sahin@example.com', 'pickup', NULL, date('now'), '16:00', '17:00', 'Müşteri talebiyle iptal edildi.', 64990, 0, 64990, 'cancelled', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-9 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 hours')),
  (6, 'NOVA-000006', 1, 'Ayşe Yılmaz', '+90 532 111 22 33', 'ayse.yilmaz@example.com', 'delivery', 'Moda, Kadıköy, İstanbul', date('now', '-1 day'), '15:00', '17:00', NULL, 99970, 4990, 104960, 'completed', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-6 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-3 hours')),
  (7, 'NOVA-000007', 6, 'Burak Aydın', '+90 537 666 77 88', 'burak.aydin@example.com', 'delivery', 'Tepebaşı, Eskişehir', date('now'), '12:00', '14:00', 'Ofis resepsiyonuna teslim.', 130970, 4990, 135960, 'preparing', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-5 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-4 hours')),
  (8, 'NOVA-000008', 7, 'Derya Koç', '+90 538 777 88 99', 'derya.koc@example.com', 'pickup', NULL, date('now', '-3 days'), '11:00', '12:00', NULL, 63980, 0, 63980, 'completed', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days', '-6 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days', '-3 hours')),
  (9, 'NOVA-000009', 2, 'Mehmet Demir', '+90 533 222 33 44', 'mehmet.demir@example.com', 'delivery', 'Beşiktaş, İstanbul', date('now', '+2 days'), '18:00', '20:00', NULL, 79980, 4990, 84970, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days', '-4 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days', '-4 hours')),
  (10, 'NOVA-000010', 8, 'Mert Çetin', '+90 539 888 99 00', 'mert.cetin@example.com', 'pickup', NULL, date('now', '-7 days'), '10:00', '11:00', NULL, 97960, 0, 97960, 'completed', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 days', '-6 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 days', '-3 hours')),
  (11, 'NOVA-000011', 4, 'Can Arslan', '+90 535 444 55 66', 'can.arslan@example.com', 'delivery', 'Çankaya, Ankara', date('now', '-13 days'), '09:00', '11:00', NULL, 95970, 4990, 100960, 'ready_for_delivery', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-14 days', '-4 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-14 days', '-2 hours')),
  (12, 'NOVA-000012', 3, 'Zeynep Kaya', '+90 534 333 44 55', 'zeynep.kaya@example.com', 'delivery', 'Nilüfer, Bursa', date('now', '-30 days'), '14:00', '16:00', NULL, 97980, 4990, 102970, 'completed', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days', '-5 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days', '-2 hours')),
  (13, 'NOVA-000013', 5, 'Elif Şahin', '+90 536 555 66 77', 'elif.sahin@example.com', 'delivery', 'Karşıyaka, İzmir', date('now', '-44 days'), '12:00', '14:00', 'Teslimat tarihi değiştiği için iptal edildi.', 45990, 4990, 50980, 'cancelled', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-45 days', '-4 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-45 days', '-3 hours')),
  (14, 'NOVA-000014', 1, 'Ayşe Yılmaz', '+90 532 111 22 33', 'ayse.yilmaz@example.com', 'pickup', NULL, date('now', '-95 days'), '13:00', '14:00', NULL, 37970, 0, 37970, 'completed', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-95 days', '-5 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-95 days', '-2 hours')),
  (15, 'NOVA-000015', 7, 'Derya Koç', '+90 538 777 88 99', 'derya.koc@example.com', 'delivery', 'Muratpaşa, Antalya', date('now', '+1 day'), '16:00', '18:00', 'Hediye paketi tercih edildi.', 104980, 4990, 109970, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-6 days', '-2 hours'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-6 days', '-2 hours'));

INSERT INTO order_items (
  id, order_id, product_id, product_name_snapshot, product_sku_snapshot,
  product_category_snapshot, unit_price_in_kurus, quantity, line_total_in_kurus
) VALUES
  (1, 1, 1, 'Anadolu Filtre Kahve 250 g', 'KHV-001', 'Kahve', 28990, 2, 57980),
  (2, 1, 8, 'El Yapımı Çikolata Kutusu', 'ATI-001', 'Atıştırmalık', 37990, 1, 37990),
  (3, 2, 2, 'Geleneksel Türk Kahvesi 250 g', 'KHV-002', 'Kahve', 19990, 1, 19990),
  (4, 2, 9, 'Kraft Hediye Paketi', 'AMB-001', 'Ambalaj', 7990, 1, 7990),
  (5, 3, 4, 'Çelik Termos 750 ml', 'AKS-002', 'Aksesuar', 79990, 1, 79990),
  (6, 4, 7, 'Bitki Çayı Seçki Kutusu', 'CAY-001', 'Çay', 42990, 2, 85980),
  (7, 4, 9, 'Kraft Hediye Paketi', 'AMB-001', 'Ambalaj', 7990, 1, 7990),
  (8, 5, 5, 'French Press 600 ml', 'EKP-001', 'Ekipman', 64990, 1, 64990),
  (9, 6, 11, 'Espresso Blend 500 g', 'KHV-003', 'Kahve', 45990, 2, 91980),
  (10, 6, 9, 'Kraft Hediye Paketi', 'AMB-001', 'Ambalaj', 7990, 1, 7990),
  (11, 7, 6, 'Cam Demlik 800 ml', 'EKP-002', 'Ekipman', 54990, 1, 54990),
  (12, 7, 8, 'El Yapımı Çikolata Kutusu', 'ATI-001', 'Atıştırmalık', 37990, 2, 75980),
  (13, 8, 1, 'Anadolu Filtre Kahve 250 g', 'KHV-001', 'Kahve', 28990, 1, 28990),
  (14, 8, 3, 'El Yapımı Seramik Kupa', 'AKS-001', 'Aksesuar', 34990, 1, 34990),
  (15, 9, 12, 'Soğuk Demleme Şişesi', 'EKP-003', 'Ekipman', 39990, 2, 79980),
  (16, 10, 2, 'Geleneksel Türk Kahvesi 250 g', 'KHV-002', 'Kahve', 19990, 3, 59970),
  (17, 10, 8, 'El Yapımı Çikolata Kutusu', 'ATI-001', 'Atıştırmalık', 37990, 1, 37990),
  (18, 11, 4, 'Çelik Termos 750 ml', 'AKS-002', 'Aksesuar', 79990, 1, 79990),
  (19, 11, 9, 'Kraft Hediye Paketi', 'AMB-001', 'Ambalaj', 7990, 2, 15980),
  (20, 12, 6, 'Cam Demlik 800 ml', 'EKP-002', 'Ekipman', 54990, 1, 54990),
  (21, 12, 7, 'Bitki Çayı Seçki Kutusu', 'CAY-001', 'Çay', 42990, 1, 42990),
  (22, 13, 11, 'Espresso Blend 500 g', 'KHV-003', 'Kahve', 45990, 1, 45990),
  (23, 14, 10, 'NOVA Bez Çanta', 'AKS-003', 'Aksesuar', 14990, 2, 29980),
  (24, 14, 9, 'Kraft Hediye Paketi', 'AMB-001', 'Ambalaj', 7990, 1, 7990),
  (25, 15, 5, 'French Press 600 ml', 'EKP-001', 'Ekipman', 64990, 1, 64990),
  (26, 15, 12, 'Soğuk Demleme Şişesi', 'EKP-003', 'Ekipman', 39990, 1, 39990);

INSERT INTO order_status_history (id, order_id, status, created_at) VALUES
  (1, 1, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-6 hours')),
  (2, 1, 'preparing', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 hours')),
  (3, 1, 'ready_for_delivery', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-4 hours')),
  (4, 1, 'completed', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 hours')),
  (5, 2, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 hours')),
  (6, 3, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 hours')),
  (7, 3, 'preparing', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-4 hours')),
  (8, 4, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 hours')),
  (9, 4, 'preparing', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-6 hours')),
  (10, 4, 'ready_for_delivery', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 hours')),
  (11, 5, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-9 hours')),
  (12, 5, 'preparing', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-8 hours')),
  (13, 5, 'cancelled', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 hours')),
  (14, 6, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-6 hours')),
  (15, 6, 'preparing', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-5 hours')),
  (16, 6, 'ready_for_delivery', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-4 hours')),
  (17, 6, 'completed', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-3 hours')),
  (18, 7, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-5 hours')),
  (19, 7, 'preparing', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-4 hours')),
  (20, 8, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days', '-6 hours')),
  (21, 8, 'preparing', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days', '-5 hours')),
  (22, 8, 'ready_for_delivery', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days', '-4 hours')),
  (23, 8, 'completed', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days', '-3 hours')),
  (24, 9, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days', '-4 hours')),
  (25, 10, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 days', '-6 hours')),
  (26, 10, 'preparing', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 days', '-5 hours')),
  (27, 10, 'ready_for_delivery', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 days', '-4 hours')),
  (28, 10, 'completed', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 days', '-3 hours')),
  (29, 11, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-14 days', '-4 hours')),
  (30, 11, 'preparing', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-14 days', '-3 hours')),
  (31, 11, 'ready_for_delivery', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-14 days', '-2 hours')),
  (32, 12, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days', '-5 hours')),
  (33, 12, 'preparing', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days', '-4 hours')),
  (34, 12, 'ready_for_delivery', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days', '-3 hours')),
  (35, 12, 'completed', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days', '-2 hours')),
  (36, 13, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-45 days', '-4 hours')),
  (37, 13, 'cancelled', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-45 days', '-3 hours')),
  (38, 14, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-95 days', '-5 hours')),
  (39, 14, 'preparing', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-95 days', '-4 hours')),
  (40, 14, 'ready_for_delivery', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-95 days', '-3 hours')),
  (41, 14, 'completed', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-95 days', '-2 hours')),
  (42, 15, 'new', strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-6 days', '-2 hours'));

-- Movement results form a chronological stock chain; each product's latest result
-- equals products.stock_quantity. Cancelled orders restore exactly what they reserved.
INSERT INTO inventory_movements (
  id, product_id, order_id, movement_type, quantity_delta,
  resulting_stock, note, created_at
) VALUES
  (1, 10, 14, 'order_created', -2, 0, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-95 days', '-5 hours')),
  (2, 9, 14, 'order_created', -1, 45, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-95 days', '-5 hours')),
  (3, 11, 13, 'order_created', -1, 15, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-45 days', '-4 hours')),
  (4, 11, 13, 'order_cancelled', 1, 16, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-45 days', '-3 hours')),
  (5, 6, 12, 'order_created', -1, 13, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days', '-5 hours')),
  (6, 7, 12, 'order_created', -1, 4, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days', '-5 hours')),
  (7, 4, 11, 'order_created', -1, 9, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-14 days', '-4 hours')),
  (8, 9, 11, 'order_created', -2, 43, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-14 days', '-4 hours')),
  (9, 2, 10, 'order_created', -3, 6, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 days', '-6 hours')),
  (10, 8, 10, 'order_created', -1, 21, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 days', '-6 hours')),
  (11, 5, 15, 'order_created', -1, 3, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-6 days', '-2 hours')),
  (12, 12, 15, 'order_created', -1, 9, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-6 days', '-2 hours')),
  (13, 1, 8, 'order_created', -1, 26, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days', '-6 hours')),
  (14, 3, 8, 'order_created', -1, 0, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days', '-6 hours')),
  (15, 12, 9, 'order_created', -2, 7, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-3 days', '-4 hours')),
  (16, 11, 6, 'order_created', -2, 14, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-6 hours')),
  (17, 9, 6, 'order_created', -1, 42, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-6 hours')),
  (18, 6, 7, 'order_created', -1, 12, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-5 hours')),
  (19, 8, 7, 'order_created', -2, 19, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day', '-5 hours')),
  (20, 5, 5, 'order_created', -1, 2, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-9 hours')),
  (21, 5, 5, 'order_cancelled', 1, 3, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 hours')),
  (22, 7, 4, 'order_created', -2, 2, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 hours')),
  (23, 9, 4, 'order_created', -1, 41, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 hours')),
  (24, 1, 1, 'order_created', -2, 24, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-6 hours')),
  (25, 8, 1, 'order_created', -1, 18, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-6 hours')),
  (26, 4, 3, 'order_created', -1, 8, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 hours')),
  (27, 2, 2, 'order_created', -1, 5, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 hours')),
  (28, 9, 2, 'order_created', -1, 40, NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-2 hours'));
