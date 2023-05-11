import { TrainTicketEstimator } from './train-estimator';
import {
  DiscountCard,
  InvalidTripInputException,
  Passenger,
  TripDetails,
  TripRequest,
} from './model/trip.request';

const BASE_PRICE = 50;

class TrainTicketEstimatorOverload extends TrainTicketEstimator {
  protected async getPriceFromApi(from: string, to: string, when: Date): Promise<number> {
    return await Promise.resolve(BASE_PRICE);
  }
}

describe('train estimator', function () {
  let alice: Passenger;
  let trainTicketEstimator: TrainTicketEstimatorOverload;
  const date: Date = new Date();

  beforeAll(() => {
    alice = new Passenger(20, []);
    trainTicketEstimator = new TrainTicketEstimatorOverload();
    date.setDate(date.getDay() + 20);
  });

  describe('exceptions throwed', function () {
    it('should return an exception when start city is invalid', async function () {
      const tripDetails = new TripDetails('', 'Marseille', new Date());
      const tripRequest = new TripRequest(tripDetails, [alice]);

      await expect(async () => await trainTicketEstimator.estimate(tripRequest)).rejects.toEqual(
        new InvalidTripInputException('Start city is invalid')
      );
    });

    it('should return an exception when destination city is invalid', async function () {
      const tripDetails = new TripDetails('Paris', '', new Date());
      const tripRequest = new TripRequest(tripDetails, [alice]);

      await expect(async () => await trainTicketEstimator.estimate(tripRequest)).rejects.toEqual(
        new InvalidTripInputException('Destination city is invalid')
      );
    });

    it('should return an exception when date is invalid', async function () {
      const badDate = new Date();
      badDate.setDate(badDate.getDay() - 10);
      const tripDetails = new TripDetails('Paris', 'Marseille', badDate);
      const tripRequest = new TripRequest(tripDetails, [alice]);

      await expect(async () => await trainTicketEstimator.estimate(tripRequest)).rejects.toEqual(
        new InvalidTripInputException('Date is invalid')
      );
    });

    it('should return an exception when a passenger age is invalid', async function () {
      const fakePassengerWithBadAge = new Passenger(-1, []);
      const tripDetails = new TripDetails('Paris', 'Marseille', new Date());
      const tripRequest = new TripRequest(tripDetails, [fakePassengerWithBadAge]);

      await expect(async () => await trainTicketEstimator.estimate(tripRequest)).rejects.toEqual(
        new InvalidTripInputException('Age is invalid')
      );
    });
  });

  describe('static prices', function () {
    it('should return 0 when no passenger', async function () {
      const tripDetails = new TripDetails('Paris', 'Milan', new Date());
      const tripRequest = new TripRequest(tripDetails, []);
      const result = await trainTicketEstimator.estimate(tripRequest);

      expect(result).toBe(0);
    });

    it('should return 0 for a less than 1 year old passenger', async function () {
      const passenger = new Passenger(0, []);
      const tripDetails: TripDetails = new TripDetails('Marseille', 'Paris', new Date());
      const tripRequest: TripRequest = new TripRequest(tripDetails, [passenger]);

      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(0);
    });

    it('should return 9 for a less than 4 year old passenger', async function () {
      const passenger = new Passenger(2, []);
      const tripDetails: TripDetails = new TripDetails('Marseille', 'Paris', new Date());
      const tripRequest: TripRequest = new TripRequest(tripDetails, [passenger]);

      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(9);
    });

    it('should return 1 due to the TrainStroke Staff discount : ', async function () {
      const passenger = new Passenger(70, [DiscountCard.TrainStroke]);
      const tripDetails: TripDetails = new TripDetails('Marseille', 'Paris', new Date());

      const tripRequest: TripRequest = new TripRequest(tripDetails, [passenger]);
      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(1);
    });
  });

  describe('dynamic prices', function () {
    it('should apply 60% of reduction ( 17years old (-40%), trip in 30days (-20%) )', async function () {
      const currentDate = new Date();
      const tripDate = new Date();
      tripDate.setDate(currentDate.getDate() + 30);

      const passenger = new Passenger(17, []);
      const tripDetails: TripDetails = new TripDetails('Marseille', 'Paris', tripDate);

      const tripRequest: TripRequest = new TripRequest(tripDetails, [passenger]);

      const expectedResult = BASE_PRICE - BASE_PRICE * 0.4 - BASE_PRICE * 0.2;
      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(expectedResult);
    });

    it('should apply 56% of reduction ( 70years old (-20%), trip in 28days (-16%), Senior discount (-20%))', async function () {
      const currentDate = new Date();
      const tripDate = new Date();
      tripDate.setDate(currentDate.getDate() + 28);

      const passenger = new Passenger(70, [DiscountCard.Senior]);
      const tripDetails: TripDetails = new TripDetails('Marseille', 'Paris', tripDate);

      const tripRequest: TripRequest = new TripRequest(tripDetails, [passenger]);

      const expectedResult = BASE_PRICE - BASE_PRICE * 0.16 - BASE_PRICE * 0.2 - BASE_PRICE * 0.2;
      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(expectedResult);
    });

    it('should apply 110% of augmentation (20years old (+20%), trip in 5 days (+100%), Hald coupe discount (-10%))', async function () {
      const currentDate = new Date();
      const tripDate = new Date();
      tripDate.setDate(currentDate.getDate() + 5);

      const passenger = new Passenger(20, [DiscountCard.HalfCouple]);
      const tripDetails: TripDetails = new TripDetails('Marseille', 'Paris', tripDate);

      const tripRequest: TripRequest = new TripRequest(tripDetails, [passenger]);

      const expectedResult = BASE_PRICE * 2 - BASE_PRICE * 0.1 + BASE_PRICE * 0.2;
      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(expectedResult);
    });

    it('should apply 60% of reduction (more than 70 years old (-20%), trip in 30 days (-20%), Senior discount (-20%))', async function () {
      const currentDate = new Date();
      const tripDate = new Date();
      tripDate.setDate(currentDate.getDate() + 30);

      const passenger = new Passenger(72, [DiscountCard.Couple]);
      const passenger2 = new Passenger(75, [DiscountCard.Couple]);
      const tripDetails: TripDetails = new TripDetails('Marseille', 'Paris', tripDate);

      const tripRequest: TripRequest = new TripRequest(tripDetails, [passenger, passenger2]);

      const expectedResult =
        (BASE_PRICE - BASE_PRICE * 0.2 - BASE_PRICE * 0.2 - BASE_PRICE * 0.2) * 2;
      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(expectedResult);
    });

    it('should apply 30% of reduction only if last name is given and the last name is the same one (Family discount)', async function () {
      const currentDate = new Date();
      const tripDate = new Date();
      tripDate.setDate(currentDate.getDate() + 30);

      const tom = new Passenger(25, [DiscountCard.Family], 'Dupont');
      const lala = new Passenger(24, [], 'Dupont');
      const jaq = new Passenger(22, []);
      const tripDetails: TripDetails = new TripDetails('Marseille', 'Paris', tripDate);

      const tripRequest: TripRequest = new TripRequest(tripDetails, [tom, lala, jaq]);

      const expectedResult =
        (BASE_PRICE - BASE_PRICE * 0.3 + BASE_PRICE * 0.2 - BASE_PRICE * 0.2) * 2 +
        BASE_PRICE +
        BASE_PRICE * 0.2 -
        BASE_PRICE * 0.2;
      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(expectedResult);
    });
  });
});
