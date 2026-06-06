import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatCurrencyFull(amount: number): string {
  return `₹ ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  const clean = phone.replace(/\D/g, "");
  if (clean.length >= 10) {
    const last10 = clean.slice(-10);
    return `+91 ${last10}`;
  }
  return `+91 ${phone}`;
}

export function formatTime12H(time24: string): string {
  if (!time24) return "";
  const parts = time24.split(":");
  if (parts.length >= 2) {
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  }
  return time24;
}

export function formatDateFriendly(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = months[month] || "";
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    return `${dayStr} ${monthName} ${year}`;
  }
  return dateStr;
}

export function formatRecentActivityTime(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = months[month] || "";
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    
    let timeFormatted = "";
    if (timeStr) {
      const timeParts = timeStr.split(":");
      if (timeParts.length >= 2) {
        let hour = parseInt(timeParts[0], 10);
        const minute = timeParts[1];
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12;
        if (hour === 0) hour = 12;
        timeFormatted = `, ${hour}:${minute} ${ampm}`;
      }
    }
    return `${dayStr} ${monthName}${timeFormatted}`;
  }
  return dateStr;
}
