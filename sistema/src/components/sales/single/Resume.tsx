import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import jsbarcode from 'jsbarcode';

import { Payment } from '@/enums/payment.enum';
import { SaleType } from '@/enums/saleType.enum';
import { formatDate } from '@/helpers/formatDate';
import { ISale } from '@/interfaces/schemas.interfaces';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    paddingHorizontal: '30px',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    paddingTop: '10px',
    justifyContent: 'center',
  },
  title: {
    backgroundColor: '#000',
    color: '#fff',
    paddingHorizontal: '10px',
    paddingVertical: '5px',
    fontWeight: 'black',
    borderRadius: '10px',
    fontSize: '25px',
  },
  description: {
    marginTop: '10px',
    textAlign: 'center',
    fontSize: '15px',
  },
  information: {
    borderTop: '1px solid #ddd',
    marginTop: '25px',
    paddingTop: '25px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemInformation: {
    textAlign: 'center',
    marginTop: '5px',
    fontSize: '9px',
  },
  itemInformationPayment: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  paymentItem: {
    fontSize: '8px',
    marginLeft: '10px',
  },
  barcode: {
    width: '110px',
  },
  checkedTitle: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '10px',
  },
  checkedItems: {
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'row',
    fontSize: '8px',
    justifyContent: 'center',
    gap: '20px',
  },
  warrantyTitle: {
    borderTop: '1px solid #ddd',
    marginTop: '15px',
    paddingTop: '15px',
    textAlign: 'center',
    fontSize: '15px',
  },
  warrantyDescription: {
    marginTop: '6px',
    textAlign: 'center',
    fontSize: '8px',
  },
  warrantyDescriptionItem: {
    marginTop: '4px',
  },
  warrantyInfo: {
    marginTop: '11px',
    fontSize: '11px',
  },
  warrantyNoItems: {
    fontSize: '8px',
  },
  phones: {
    borderTop: '1px solid #ddd',
    marginTop: '15px',
    paddingTop: '15px',
    fontSize: '10px',
  },
  footer: {
    borderTop: '1px solid #ddd',
    marginTop: '8px',
    paddingTop: '8px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signature: {
    marginTop: '80px',
    paddingTop: '5px',
    width: '200px',
    borderTop: '1px solid #333',
  },
  amounts: {
    marginTop: '80px',
  },
  amountsItem: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: '10px',
  },
});

const stylesTable = StyleSheet.create({
  table: {
    width: '100%',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    borderTop: '1px solid #EEE',
    paddingTop: 8,
    paddingBottom: 8,
  },
  header: {
    borderTop: 'none',
  },
  bold: {
    fontWeight: 'bold',
  },
  col1: {
    width: '20%',
  },
  col2: {
    width: '80%',
  },
  footer: {
    textAlign: 'right',
  },
});

interface Props {
  data: ISale;
  businessName?: string;
}

export default function Resume({ data, businessName }: Props) {
  let canvas;

  // For Barcode
  canvas = document.createElement('canvas');
  jsbarcode(canvas, data.code);
  const barcode = canvas.toDataURL();

  // Nombre del negocio (prop o localStorage)
  const tenantName = businessName || (typeof window !== 'undefined' ? localStorage.getItem('tenantName') : null) || 'MI NEGOCIO';

  const addDays = (actual: Date, days: number) => {
    const date = new Date(actual);
    date.setDate(date.getDate() + days);
    return date;
  };

  const paymentSale: { [key in Payment]: string } = {
    EfectiveArs: 'Efectivo Pesos',
    EfectiveUsd: 'Efectivo USD',
    EfectiveEuros: 'Efectivo Euros',
    TransferArs: 'Transferencia Pesos',
    TransferUsdt: 'Transferencia USDT',
  };

  const typeSale: { [key: string]: string } = {
    Wholesale: 'Mayorista',
    Retail: 'Minorista',
  };

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{tenantName.toUpperCase()}</Text>
        </View>
        <View style={styles.description}>
          <Text>FACTURA Y GARANTIA</Text>
        </View>
        <View style={styles.information}>
          <View>
            <Text style={styles.itemInformation}>
              Cliente: {data.client.name}
            </Text>
            <Text style={styles.itemInformation}>
              Tipo: {typeSale[data.type]}
            </Text>
            <View style={styles.itemInformation}>
              <Text>Metodo/s de pago:</Text>
              <View style={styles.itemInformationPayment}>
                {data.payment.map((x, i) => (
                  <Text key={i} style={styles.paymentItem}>
                    - {paymentSale[x.type]}
                  </Text>
                ))}
              </View>
            </View>
            <Text style={styles.itemInformation}>
              Fecha de compra:{' '}
              {formatDate(data.createdAt, 'es', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            <Text style={styles.itemInformation}>
              Vencimiento de garantia:{' '}
              {formatDate(addDays(data.createdAt, 30), 'es', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View>
            <Image source={barcode} style={styles.barcode} />
          </View>
        </View>
        <View style={styles.checkedTitle}>
          <Text>CHEQUEO DE COMPONENTES</Text>
        </View>
        <View style={styles.checkedItems}>
          <Text>Camara</Text>
          <Text>Linterna</Text>
          <Text>Parlantes</Text>
          <Text>Microfono</Text>
          <Text>Touch ID / Face ID</Text>
        </View>
        <View style={styles.warrantyTitle}>
          <Text>GARANTIA DE 30 DIAS</Text>
        </View>
        <View style={styles.warrantyDescription}>
          <Text style={styles.warrantyDescriptionItem}>
            EN EQUIPOS SEMINUEVOS
          </Text>
          <Text style={styles.warrantyDescriptionItem}>
            NUEVOS SELLADOS 1 AÑO DE GARANTIA CON APPLE
          </Text>
        </View>
        <View style={styles.warrantyInfo}>
          <Text>La garantia cubre solo DAÑOS DE SOFTWARE</Text>
        </View>
        <View
          style={{ fontSize: '15px', marginTop: '5px', fontWeight: 'semibold' }}
        >
          <Text>NO CUBRE:</Text>
        </View>
        <View style={styles.warrantyNoItems}>
          <Text>- Daños causados por terceros</Text>
          <Text>- Robo o hurto</Text>
          <Text>- Modificaciones</Text>
          <Text>- Dispositivo dañado por el uso incorrecto</Text>
          <Text>- Golpes</Text>
          <Text>- Daños causados por sumergir el equipo en agua</Text>
          <Text>
            - Problemas del modulo = Mucha presión del usuario al mismo
          </Text>
        </View>
        <View style={styles.phones}>
          {/* TABLE */}
          <View style={stylesTable.table}>
            <View
              style={[stylesTable.row, stylesTable.bold, stylesTable.header]}
            >
              <Text style={stylesTable.col1}>IMEI</Text>
              <Text style={stylesTable.col2}>Descripción</Text>
            </View>

            {data.items.map((item, i) => (
              <View
                style={[stylesTable.row, { fontSize: '8px' }]}
                key={i}
                wrap={false}
              >
                <Text style={stylesTable.col1}>{item.imei}</Text>
                <Text style={stylesTable.col2}>
                  {item.model} {item.color} {item.storage} {item.battery}%
                </Text>
              </View>
            ))}

            <View style={stylesTable.footer}>
              <Text>Total de unidades: {data.items.length}</Text>
            </View>
          </View>

          {/* SIGNATURE */}
          <View style={styles.footer}>
            <Text></Text>
            <View style={styles.amounts}>
              {data.type === SaleType.RETAIL && (
                <View>
                  <Text>Total: ${data.totalAmount}</Text>
                </View>
              )}
              {data.type === SaleType.WHOLESALE && (
                <>
                  <View style={styles.amountsItem}>
                    <View>
                      <Text>Subtotal: </Text>
                    </View>
                    <View>
                      <Text>${data.amounts.subTotal}</Text>
                    </View>
                  </View>
                  <View style={styles.amountsItem}>
                    <View>
                      <Text>Descuento: </Text>
                    </View>
                    <View>
                      <Text>- ${data.amounts.discount}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.amountsItem,
                      {
                        marginTop: '5px',
                        paddingTop: '5px',
                        borderTop: '1px solid #ddd',
                      },
                    ]}
                  >
                    <View>
                      <Text>Total: </Text>
                    </View>
                    <View>
                      <Text>${data.totalAmount}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
