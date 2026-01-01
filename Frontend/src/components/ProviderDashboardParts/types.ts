
// FIX: Added 'settings' to the ProviderView type to resolve a type error where it was being treated as an invalid view.
export type ProviderView = 'overview' | 'openOrders' | 'myBids' | 'accepted' | 'wallet' | 'profile' | 'flashProducts' | 'settings' | 'store' | 'internationalLicense';
