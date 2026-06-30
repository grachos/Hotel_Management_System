ALTER TABLE reservaciones
  ADD COLUMN incluye_comidas TINYINT(1) NOT NULL DEFAULT 0 AFTER notas;

ALTER TABLE pedidos
  ADD COLUMN recargo_delivery DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER tipo_entrega;
