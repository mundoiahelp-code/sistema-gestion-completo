// Centralized notification messages for bilingual support

export const getNotificationMessages = (locale: string = 'es') => {
  const isEnglish = locale === 'en';

  return {
    // Products
    productUpdated: isEnglish ? 'Product updated successfully' : 'Producto actualizado con éxito',
    productDeleted: isEnglish ? 'Product deleted successfully' : 'Producto eliminado con éxito',
    productAdded: isEnglish ? 'Product added' : 'Producto agregado',
    productRemoved: isEnglish ? 'Product removed' : 'Producto eliminado',
    quantityUpdated: isEnglish ? 'Quantity updated' : 'Cantidad actualizada',
    accessoryAdded: isEnglish ? 'Accessory added' : 'Accesorio agregado',
    
    // Clients
    clientCreated: isEnglish ? 'Client created successfully!' : 'Cliente creado con éxito!',
    clientUpdated: isEnglish ? 'Client updated successfully!' : 'Cliente actualizado con éxito!',
    clientDeleted: isEnglish ? 'Client deleted successfully!' : 'Cliente eliminado con éxito!',
    
    // Users
    userCreated: isEnglish ? 'User created successfully!' : 'Usuario creado con exito!',
    userDeleted: isEnglish ? 'User deleted successfully!' : 'Usuario eliminado con exito!',
    
    // Sales
    saleConfirmed: isEnglish ? 'Sale confirmed!' : 'La venta se confirmo!',
    
    // Orders
    orderLoaded: isEnglish ? 'Entry loaded successfully!' : 'Ingreso cargado correctamente!',
    
    // Settings
    accountUpdated: isEnglish ? 'Account updated successfully' : 'Cuenta actualizada correctamente',
    profileColorUpdated: isEnglish ? 'Profile color updated' : 'Color de perfil actualizado',
    
    // Confirmations
    confirmDelete: isEnglish ? 'Are you sure you want to delete this product?' : '¿Estás seguro de eliminar este producto?',
    
    // Errors
    errorUpdating: isEnglish ? 'Error updating product' : 'Error al actualizar el producto',
    errorDeleting: isEnglish ? 'Error deleting product' : 'Error al eliminar el producto',
    productNotFound: isEnglish ? 'Product not found' : 'El producto no existe',
  };
};
