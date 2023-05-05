import { TrainTicketEstimator } from './train-estimator';
import {
  DiscountCard,
  InvalidTripInputException,
  Passenger,
  TripDetails,
  TripRequest,
} from './model/trip.request';

class TrainTicketEstimatorOverload extends TrainTicketEstimator {
  protected async getPriceFromApi(from: string, to: string, when: Date): Promise<number> {
    return await Promise.resolve(50);
  }
}

describe('train estimator', function () {
  it('should return 0 when no passenger', async function () {
    const tripDetails = new TripDetails('Paris', 'Milan', new Date());
    const tripRequest = new TripRequest(tripDetails, []);
    const trainTicketEstimator = new TrainTicketEstimatorOverload();
    const result = await trainTicketEstimator.estimate(tripRequest);
    expect(result).toBe(0);
  });
});
describe('exceptions handling', function () {
  const fakePassenger = new Passenger(20, []);
  it('should return an exception when start city is invalid', async function () {
    const tripDetails = new TripDetails('', 'Marseille', new Date());
    const tripRequest = new TripRequest(tripDetails, [fakePassenger]);
    const trainTicketEstimator = new TrainTicketEstimatorOverload();
    await expect(async () => await trainTicketEstimator.estimate(tripRequest)).rejects.toEqual(
      new InvalidTripInputException('Start city is invalid')
    );
  });
  it('should return an exception when destination city is invalid', async function () {
    const tripDetails = new TripDetails('Paris', '', new Date());
    const tripRequest = new TripRequest(tripDetails, [fakePassenger]);
    const trainTicketEstimator = new TrainTicketEstimatorOverload();
    await expect(async () => await trainTicketEstimator.estimate(tripRequest)).rejects.toEqual(
      new InvalidTripInputException('Destination city is invalid')
    );
  });
  it('should return an exception when date is invalid', async function () {
    const badDate = new Date();
    badDate.setDate(badDate.getDay() - 10);
    const tripDetails = new TripDetails('Paris', 'Marseille', badDate);
    const tripRequest = new TripRequest(tripDetails, [fakePassenger]);
    const trainTicketEstimator = new TrainTicketEstimatorOverload();
    await expect(async () => await trainTicketEstimator.estimate(tripRequest)).rejects.toEqual(
      new InvalidTripInputException('Date is invalid')
    );
  });
  it('should return an exception when a passenger age is invalid', async function () {
    const fakePassengerWithBadAge = new Passenger(-1, []);
    const tripDetails = new TripDetails('Paris', 'Marseille', new Date());
    const tripRequest = new TripRequest(tripDetails, [fakePassengerWithBadAge]);
    const trainTicketEstimator = new TrainTicketEstimatorOverload();
    await expect(async () => await trainTicketEstimator.estimate(tripRequest)).rejects.toEqual(
      new InvalidTripInputException('Age is invalid')
    );
  });
});
