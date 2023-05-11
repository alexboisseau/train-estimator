import {
  DISCOUNT_FOR_AGE_OTHER,
  DISCOUNT_FOR_AGE_OVER_70,
  DISCOUNT_FOR_AGE_UNDER_17,
  DISCOUNT_FOR_COUPLE,
  DISCOUNT_FOR_FAMILY,
  DISCOUNT_FOR_HALF_COUPLE,
  DISCOUNT_FOR_SENIOR,
  DISCOUNT_FOR_TRIP_DATE_30_PLUS,
  DISCOUNT_FOR_TRIP_DATE_5_TO_30,
  DISCOUNT_FOR_TRIP_DATE_IN_LESS_THAN_6H,
  PRICE_AGE_BETWEEN_1_AND_4_YEARS_OLD,
  PRICE_TRAIN_STROKE_DISCOUNT_CARD,
} from './constants';
import {
  ApiException,
  DiscountCard,
  InvalidTripInputException,
  Passenger,
  TripRequest,
} from './model/trip.request';
import { addHours, calculateDaysDifference } from './utils';

export class TrainTicketEstimator {
  async estimate(tripRequest: TripRequest): Promise<number> {
    this.validTripRequestInput(tripRequest);

    let basePrice: number;
    try {
      basePrice = await this.getPriceFromApi(
        tripRequest.details.from,
        tripRequest.details.to,
        tripRequest.details.when
      );
    } catch (error) {
      throw new ApiException();
    }

    const passengers = tripRequest.passengers;
    let totalPrice = 0;

    totalPrice = this.getTotalPriceForPassengers(passengers, basePrice, totalPrice, tripRequest);

    return totalPrice;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async getPriceFromApi(from: string, to: string, when: Date): Promise<number> {
    throw new Error('Should not be call from a test');
  }

  private getTotalPriceForPassengers(
    passengers: Passenger[],
    basePrice: number,
    totalPrice: number,
    tripRequest: TripRequest
  ) {
    for (let i = 0; i < passengers.length; i++) {
      let tmp = basePrice;
      const currentPassenger = passengers[i];

      if (currentPassenger.age < 1) continue;

      const passengerIsBetween1And4YearsOld = currentPassenger.age > 0 && currentPassenger.age < 4;
      const passengerHasTrainStroke = currentPassenger.discounts.includes(DiscountCard.TrainStroke);

      if (passengerIsBetween1And4YearsOld || passengerHasTrainStroke) {
        tmp = passengerIsBetween1And4YearsOld
          ? PRICE_AGE_BETWEEN_1_AND_4_YEARS_OLD
          : PRICE_TRAIN_STROKE_DISCOUNT_CARD;
        totalPrice += tmp;
        continue;
      }

      const discountForAge = this.getDiscountFromAge(currentPassenger.age);
      const discountForDate = this.getDiscountFromTripDate(tripRequest.details.when);
      const discountForDiscountCard = this.getDiscountFromDiscountCard(
        currentPassenger,
        passengers
      );

      tmp +=
        basePrice * discountForAge +
        basePrice * discountForDate +
        basePrice * discountForDiscountCard;
      totalPrice += tmp;
    }
    return totalPrice;
  }

  private validTripRequestInput(tripRequest: TripRequest) {
    if (tripRequest.passengers.length === 0) {
      return 0;
    } else if (tripRequest.details.from.trim().length === 0) {
      throw new InvalidTripInputException('Start city is invalid');
    } else if (tripRequest.details.to.trim().length === 0) {
      throw new InvalidTripInputException('Destination city is invalid');
    } else if (
      tripRequest.details.when <
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0)
    ) {
      throw new InvalidTripInputException('Date is invalid');
    }

    tripRequest.passengers.forEach((passenger) => {
      if (passenger.age < 0) {
        throw new InvalidTripInputException('Age is invalid');
      }
    });
  }

  private getDiscountFromTripDate(tripDate: Date) {
    const currentDate = new Date();
    const sixHoursAgo = addHours(currentDate, 6);
    const thirtyDaysFromNow = new Date(currentDate.setDate(currentDate.getDate() + 30));
    const fiveDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 30 + 5));

    if (tripDate >= thirtyDaysFromNow) return DISCOUNT_FOR_TRIP_DATE_30_PLUS;
    if (tripDate > fiveDaysAgo && tripDate > sixHoursAgo) {
      const diffDays = calculateDaysDifference(tripDate, new Date());
      return (20 - diffDays) * DISCOUNT_FOR_TRIP_DATE_5_TO_30;
    }
    if (tripDate < fiveDaysAgo && tripDate <= sixHoursAgo) {
      return DISCOUNT_FOR_TRIP_DATE_IN_LESS_THAN_6H;
    } else {
      return 1;
    }
  }

  private getDiscountFromAge(age: number) {
    if (age <= 17) {
      return DISCOUNT_FOR_AGE_UNDER_17;
    } else if (age >= 70) {
      return DISCOUNT_FOR_AGE_OVER_70;
    } else {
      return DISCOUNT_FOR_AGE_OTHER;
    }
  }

  private getDiscountFromDiscountCard(passenger: Passenger, passengers: Passenger[]) {
    let totalDiscount = 0;
    if (passenger.lastName) {
      const hasFamilyDiscountCard = passengers.some(
        (passengerInTheList) =>
          passengerInTheList.discounts.includes(DiscountCard.Family) &&
          passengerInTheList.lastName === passenger.lastName
      );
      if (hasFamilyDiscountCard) {
        return DISCOUNT_FOR_FAMILY;
      }
    }

    if (passenger.discounts.includes(DiscountCard.Senior) && passenger.age >= 70) {
      totalDiscount += DISCOUNT_FOR_SENIOR;
    }

    if (passengers.length == 2) {
      const hasCoupleDiscountCard = passengers.some((p) =>
        p.discounts.includes(DiscountCard.Couple)
      );
      const areMajors = passengers.every((p) => p.age >= 18);

      if (hasCoupleDiscountCard && areMajors) totalDiscount += DISCOUNT_FOR_COUPLE;
    }

    if (
      passengers.length == 1 &&
      passenger.discounts.includes(DiscountCard.HalfCouple) &&
      passenger.age > 18
    ) {
      totalDiscount += DISCOUNT_FOR_HALF_COUPLE;
    }

    return totalDiscount;
  }
}
