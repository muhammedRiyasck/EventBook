export interface ServiceFormState {
  title: string;
  category: string;
  customCategory: string;
  description: string;
  pricePerDay: string;
  pricingUnit: string;
  capacity: string;
  cancellationPolicy: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  tags: string[];
  amenities: string[];
  availableFrom: string;
  availableTo: string;
}

export const validateServiceField = (
  name: string,
  value: unknown,
  formState: ServiceFormState,
): string => {
  if (typeof value !== "string") return ""; // We only validate string fields live for now

  switch (name) {
    case "title":
      if (!value.trim()) return "Title is required";
      if (value.trim().length < 3) return "Title must be at least 3 characters";
      break;
    case "category":
      if (!value) return "Category is required";
      break;
    case "customCategory":
      if (formState.category === "other" && !value.trim())
        return "Custom category is required";
      break;
    case "description":
      if (!value.trim()) return "Description is required";
      if (value.trim().length < 10)
        return "Description must be at least 10 characters";
      break;
    case "pricePerDay":
      if (!value) return "Price is required";
      if (Number(value) <= 0) return "Price must be greater than 0";
      break;
    case "capacity":
      if (value && Number(value) < 1) return "Capacity must be at least 1";
      break;
    case "city":
      if (!value.trim()) return "City is required";
      if (value.trim().length < 2) return "City must be at least 2 characters";
      break;
    case "state":
      if (!value.trim()) return "State is required";
      if (value.trim().length < 2) return "State must be at least 2 characters";
      break;
    case "address":
      if (!value.trim()) return "Address is required";
      if (value.trim().length < 5)
        return "Address must be at least 5 characters";
      break;
    case "phone":
      if (!value.trim()) return "Phone is required";
      if (!/^\d{10}$/.test(value))
        return "Please enter a valid 10-digit phone number";
      break;
    case "email":
      if (!value.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        return "Please enter a valid email address";
      break;
    case "website":
      if (value && !/^https?:\/\/.*/.test(value))
        return "Please enter a valid URL (starting with http:// or https://)";
      break;
    case "availableFrom":
      if (value && formState.availableTo) {
        if (new Date(value as string) > new Date(formState.availableTo)) {
          return "Start date cannot be after end date";
        }
      }
      break;
    case "availableTo":
      if (value && formState.availableFrom) {
        if (new Date(value as string) < new Date(formState.availableFrom)) {
          return "End date cannot be before start date";
        }
      }
      break;
  }
  return "";
};

export const validateServiceForm = (
  formState: ServiceFormState,
): Record<string, string> => {
  const errors: Record<string, string> = {};
  Object.keys(formState).forEach((key) => {
    const error = validateServiceField(
      key,
      formState[key as keyof ServiceFormState],
      formState,
    );
    if (error) errors[key] = error;
  });
  return errors;
};
