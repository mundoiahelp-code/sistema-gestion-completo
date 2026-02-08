'use client';

import { useState } from 'react';
import useSale from '@/hooks/useSale';
import ClientForm from './ClientForm';
import Sale from './Sale';

export default function CreateSale() {
  const saleData = useSale();
  const [skipClient, setSkipClient] = useState(true); // Empezar directamente en la venta

  const {
    amount,
    client,
    handleAddItem,
    handleAddAccessory,
    handleRemoveItem,
    handleSearchClient,
    items,
    loading,
    notes,
    handleSelectClient,
    payment,
    setPayment,
    resume,
    handleConfirmSale,
    phonePayment,
    setPhonePayment,
    saleType,
    setSaleType,
    wholesaleClientName,
  } = saleData;

  if (!client && !skipClient)
    return (
      <ClientForm
        handleSearchClients={handleSearchClient}
        handleSelectClient={handleSelectClient}
        handleSkipClient={() => setSkipClient(true)}
        loading={loading}
      />
    );
  
  return (
    <Sale
      items={items}
      client={client}
      handleAddItem={handleAddItem}
      handleAddAccessory={handleAddAccessory}
      handleRemoveItem={handleRemoveItem}
      loading={loading}
      notes={notes}
      amount={amount}
      resume={resume}
      payment={payment}
      setPayment={setPayment}
      handleConfirmSale={handleConfirmSale}
      phonePayment={phonePayment}
      setPhonePayment={setPhonePayment}
      saleType={saleType}
      setSaleType={setSaleType}
      wholesaleClientName={wholesaleClientName}
    />
  );
}
