import {
  ApiException,
  DiscountCard,
  InvalidTripInputException,
  TripRequest,
} from './model/trip.request';

export class TrainTicketEstimator {
  protected async getPriceFromApi(from: string, to: string, when: Date): Promise<number> {
    throw new Error('Should not be call from a test');
  }

  validTripRequestInput(tripRequest: TripRequest) {
    if (tripRequest.passengers.length === 0) {
      return 0;
    }

    if (tripRequest.details.from.trim().length === 0) {
      throw new InvalidTripInputException('Start city is invalid');
    }

    if (tripRequest.details.to.trim().length === 0) {
      throw new InvalidTripInputException('Destination city is invalid');
    }

    if (
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

  getDiscountFromTripDate(tripDate: Date) {
    const d = new Date();
    if (tripDate.getTime() >= d.setDate(d.getDate() + 30)) {
      return -0.2;
    } else if (tripDate.getTime() > d.setDate(d.getDate() - 30 + 5)) {
      const date1 = tripDate;
      const date2 = new Date();
      //https://stackoverflow.com/questions/43735678/typescript-get-difference-between-two-dates-in-days
      const diff = Math.abs(date1.getTime() - date2.getTime());
      const diffDays = Math.ceil(diff / (1000 * 3600 * 24));

      return (20 - diffDays) * 0.02;
    } else {
      return 1;
    }
  }

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
    let tmp = basePrice;
    for (let i = 0; i < passengers.length; i++) {
      if (passengers[i].age < 1) {
        continue;
      } else if (passengers[i].age <= 17) {
        tmp = basePrice * 0.6;
      } else if (passengers[i].age >= 70) {
        tmp = basePrice * 0.8;
        if (passengers[i].discounts.includes(DiscountCard.Senior)) {
          tmp -= basePrice * 0.2;
        }
      } else {
        tmp = basePrice * 1.2;
      }

      tmp += this.getDiscountFromTripDate(tripRequest.details.when) * basePrice;

      if (passengers[i].age > 0 && passengers[i].age < 4) {
        tmp = 9;
      }

      if (passengers[i].discounts.includes(DiscountCard.TrainStroke)) {
        tmp = 1;
      }

      totalPrice += tmp;
      tmp = basePrice;
    }

    if (passengers.length == 2) {
      let isCouple = false;
      let isHalfCouple = false;
      for (let i = 0; i < passengers.length; i++) {
        if (passengers[i].discounts.includes(DiscountCard.Couple)) {
          isCouple = true;
        }
        if (passengers[i].age < 18) {
          isHalfCouple = true;
        }
      }
      if (isCouple && !isHalfCouple) {
        totalPrice -= basePrice * 0.2 * 2;
      }
    }

    if (passengers.length == 1) {
      let isCouple = false;
      let isHalfCouple = false;
      for (let i = 0; i < passengers.length; i++) {
        if (passengers[i].discounts.includes(DiscountCard.HalfCouple)) {
          isCouple = true;
        }
        if (passengers[i].age < 18) {
          isHalfCouple = true;
        }
      }
      if (isCouple && !isHalfCouple) {
        totalPrice -= basePrice * 0.1;
      }
    }

    return totalPrice;
  }
}
