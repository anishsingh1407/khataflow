import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { Customer, Transaction, CustomerStatus } from "./types";

/**
 * Fetches all customer documents from /shops/{shopId}/customers,
 * ordered by lastUpdated descending.
 */
export async function getCustomers(shopId: string): Promise<Customer[]> {
  const customersRef = collection(db, "shops", shopId, "customers");
  const q = query(customersRef, orderBy("lastUpdated", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Customer[];
}

/**
 * Adds a new customer document under /shops/{shopId}/customers and returns the new document ID.
 */
export async function addCustomer(shopId: string, data: Omit<Customer, "id">): Promise<string> {
  const customersRef = collection(db, "shops", shopId, "customers");
  const docRef = await addDoc(customersRef, data);
  return docRef.id;
}

/**
 * Updates a customer's balance, status, and lastUpdated timestamp in Firestore.
 */
export async function updateCustomerBalance(
  shopId: string,
  customerId: string,
  newBalance: number,
  newStatus: CustomerStatus
): Promise<void> {
  const customerRef = doc(db, "shops", shopId, "customers", customerId);
  await updateDoc(customerRef, {
    balance: newBalance,
    status: newStatus,
    lastUpdated: new Date().toISOString(),
  });
}

/**
 * Adds a transaction document to the global /shops/{shopId}/transactions path.
 */
export async function addTransaction(
  shopId: string,
  txn: Omit<Transaction, "id">
): Promise<string> {
  const transactionsRef = collection(db, "shops", shopId, "transactions");
  const docRef = await addDoc(transactionsRef, txn);
  return docRef.id;
}

/**
 * Fetches all transaction documents for a specific customer from /shops/{shopId}/transactions,
 * ordered by date descending.
 */
export async function getCustomerTransactions(
  shopId: string,
  customerId: string
): Promise<Transaction[]> {
  const transactionsRef = collection(db, "shops", shopId, "transactions");
  const q = query(
    transactionsRef,
    where("customerId", "==", customerId),
    orderBy("date", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Transaction[];
}
