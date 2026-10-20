import { Booking, Service, User as UserType } from "@/types";

export type EarningsTabType = "transactions" | "overview" | "refunds" | "reports";

export interface PopulatedBooking extends Omit<Booking, "user" | "service"> {
  user: UserType;
  service: Service;
}
