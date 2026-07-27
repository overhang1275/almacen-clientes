import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { unitLabel } from "@/app/(roles)/units";

export const runtime = "nodejs";

type RouteProps = {
  params: { orderId: string };
};

type Order = {
  id: string;
  op_number: string;
  description: string;
  due_date: string | null;
  created_at: string;
  created_by: string | null;
  clients: { name: string; tax_id: string | null; address: string | null } | null;
};

type Allocation = {
  quantity: number;
  stock_unit: string;
  materials: {
    batch_number: string | null;
    material_type: string;
    material_categories: { name: string } | null;
  } | null;
};

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: "Helvetica", fontSize: 10, color: "#0f172a" },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#cbd5e1", paddingBottom: 14 },
  logo: { width: 58, height: 42, borderWidth: 1, borderColor: "#0f172a", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 },
  title: { textAlign: "right" },
  h1: { fontSize: 18, fontWeight: 700 },
  op: { marginTop: 6, fontSize: 24, fontWeight: 700 },
  section: { marginTop: 18 },
  sectionTitle: { marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#334155" },
  grid: { flexDirection: "row", gap: 18 },
  col: { flex: 1 },
  label: { color: "#64748b" },
  value: { marginBottom: 6, fontSize: 11 },
  table: { marginTop: 8, borderWidth: 1, borderColor: "#cbd5e1" },
  row: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  head: { flexDirection: "row", backgroundColor: "#f1f5f9" },
  cell: { flex: 1, padding: 7 },
  small: { flex: 0.7, padding: 7 },
  footer: { position: "absolute", left: 36, right: 36, bottom: 28, borderTopWidth: 1, borderTopColor: "#cbd5e1", paddingTop: 10, fontSize: 8, color: "#475569" },
  signature: { marginTop: 30, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#0f172a", width: 220, textAlign: "center" }
});

export async function GET(_request: Request, { params }: RouteProps) {
  const profile = await requireRole(["ADMIN", "ENLACE"]);
  const supabase = createClient();

  const { data: order } = await supabase
    .from("production_orders")
    .select("id, op_number, description, due_date, created_at, created_by, clients(name, tax_id, address)")
    .eq("id", params.orderId)
    .single<Order>();

  if (!order) notFound();

  const [{ data: creator }, { data: allocations = [] }] = await Promise.all([
    order.created_by ? supabase.from("profiles").select("full_name").eq("id", order.created_by).maybeSingle<{ full_name: string }>() : Promise.resolve({ data: null }),
    supabase
      .from("allocations")
      .select("quantity, stock_unit, materials(batch_number, material_type, material_categories(name))")
      .eq("production_order_id", order.id)
      .order("created_at", { ascending: true })
      .returns<Allocation[]>()
  ]);

  const generatedAt = new Date();
  const author = creator?.full_name ?? profile.full_name;
  const pdf = await renderToBuffer(<OpPdf allocations={allocations ?? []} author={author} generatedAt={generatedAt} order={order} />);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="OP-${order.op_number}.pdf"`
    }
  });
}

function OpPdf({ order, allocations, author, generatedAt }: { order: Order; allocations: Allocation[]; author: string; generatedAt: Date }) {
  return (
    <Document author={author} subject="Orden de produccion" title={`OP ${order.op_number}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text>CF</Text>
          </View>
          <View style={styles.title}>
            <Text style={styles.h1}>ORDEN DE PRODUCCION</Text>
            <Text>DOCUMENTO DE ASIGNACION DE MATERIAL</Text>
            <Text style={styles.op}>{order.op_number}</Text>
          </View>
        </View>

        <View style={[styles.section, styles.grid]}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <Text style={styles.label}>Razon social</Text>
            <Text style={styles.value}>{order.clients?.name ?? "-"}</Text>
            <Text style={styles.label}>RFC</Text>
            <Text style={styles.value}>{order.clients?.tax_id ?? "-"}</Text>
            <Text style={styles.label}>Direccion</Text>
            <Text style={styles.value}>{order.clients?.address ?? "-"}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Detalles de OP</Text>
            <Text style={styles.label}>Fecha de creacion</Text>
            <Text style={styles.value}>{formatDate(order.created_at)}</Text>
            <Text style={styles.label}>Entrega estimada</Text>
            <Text style={styles.value}>{order.due_date ? formatDate(order.due_date) : "-"}</Text>
            <Text style={styles.label}>Elaborado por</Text>
            <Text style={styles.value}>{author}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripcion del producto</Text>
          <Text>{order.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materiales asignados</Text>
          {allocations.length ? (
            <View style={styles.table}>
              <View style={styles.head}>
                <Text style={styles.cell}>Categoria</Text>
                <Text style={styles.small}>Familia</Text>
                <Text style={styles.cell}>Lote</Text>
                <Text style={styles.small}>Cantidad</Text>
                <Text style={styles.small}>Unidad</Text>
              </View>
              {allocations.map((allocation, index) => (
                <View key={index} style={styles.row}>
                  <Text style={styles.cell}>{allocation.materials?.material_categories?.name ?? "-"}</Text>
                  <Text style={styles.small}>{allocation.materials?.material_type ?? "-"}</Text>
                  <Text style={styles.cell}>{allocation.materials?.batch_number ?? "-"}</Text>
                  <Text style={styles.small}>{allocation.quantity}</Text>
                  <Text style={styles.small}>{unitLabel(allocation.stock_unit)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text>Sin materiales asignados aun.</Text>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.signature}>Elaborado por: {author}</Text>
          <Text>Este documento es un anexo al sistema de inventario en consignacion. No tiene validez contable.</Text>
          <Text>Generado: {formatDateTime(generatedAt)} | Pagina 1</Text>
        </View>
      </Page>
    </Document>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-MX");
}

function formatDateTime(value: Date) {
  return value.toLocaleString("es-MX");
}
