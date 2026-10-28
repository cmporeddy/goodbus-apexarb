import React from 'react';
import { BusTrip, Seat, BoardingPoint, DroppingPoint } from '../types';

interface BoardingDroppingScreenProps {
  bus: BusTrip;
  selectedSeats: Seat[];
  selectedBoarding: BoardingPoint;
  selectedDropping: DroppingPoint;
  onSelectBoarding: (point: BoardingPoint) => void;
  onSelectDropping: (point: DroppingPoint) => void;
  onProceedToPassengers: () => void;
  onBackToSeats: () => void;
}

export const BoardingDroppingScreen: React.FC<BoardingDroppingScreenProps> = ({
  bus,
  selectedSeats,
  selectedBoarding,
  selectedDropping,
  onSelectBoarding,
  onSelectDropping,
  onProceedToPassengers,
  onBackToSeats
}) => {
  const totalFare = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  return (
    <main className="min-h-screen pt-24 pb-20 bg-[#F9FAFB]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation back and header */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={onBackToSeats}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-full border border-gray-200 transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Seat Selection</span>
          </button>
        </div>

        {/* Master Bus Header Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl ${bus.operatorLogoBg} ${bus.operatorLogoColor} font-bold text-sm flex items-center justify-center shrink-0 shadow-sm`}
              >
                {bus.operatorLogoText}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-medium text-gray-900">{bus.operator}</h2>
                  <span className="bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2 py-0.5 rounded-full">
                    ★ {bus.rating}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-light">{bus.busType}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-gray-400 font-light">Selected Seats:</span>
              <div className="font-medium text-gray-900 text-sm flex items-center sm:justify-end gap-1.5 mt-0.5 flex-wrap">
                {selectedSeats.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-mono font-medium shadow-xs"
                  >
                    {s.number}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center justify-between gap-4 pt-4 text-xs">
            <div>
              <span className="font-mono font-light text-base text-gray-900 block">
                {bus.departureTime}
              </span>
              <span className="font-normal text-gray-600">{bus.sourceCity}</span>
            </div>

            <div className="flex-1 flex flex-col items-center max-w-xs px-4">
              <span className="text-[11px] font-medium text-gray-400 uppercase">{bus.duration}</span>
              <div className="w-full flex items-center gap-1 my-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                <div className="flex-1 border-t border-dashed border-gray-300"></div>
                <span className="material-symbols-outlined text-gray-400 text-[14px]">
                  arrow_forward
                </span>
              </div>
              <span className="text-[10px] text-gray-400">{bus.routeVia}</span>
            </div>

            <div className="text-right">
              <span className="font-mono font-light text-base text-gray-900 block">
                {bus.arrivalTime}
              </span>
              <span className="font-normal text-gray-600">{bus.destinationCity}</span>
            </div>
          </div>
        </div>

        {/* Boarding and Dropping Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Boarding Points */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-50 text-[#d84e55] font-semibold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="font-medium text-gray-900 text-sm">
                  Select Boarding Point ({bus.sourceCity})
                </h3>
              </div>
              <span className="text-[11px] text-gray-400 font-light">Pickup</span>
            </div>

            <div className="space-y-2.5">
              {(bus.boardingPoints || []).map((bp) => {
                const isChecked = selectedBoarding?.id === bp.id;
                return (
                  <div
                    key={bp.id}
                    onClick={() => onSelectBoarding(bp)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isChecked
                        ? 'border-[#d84e55] bg-[#fff8f8] shadow-sm ring-1 ring-[#d84e55]'
                        : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isChecked
                              ? 'border-[#d84e55] bg-[#d84e55]'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 text-xs sm:text-sm">{bp.name}</h4>
                        <p className="text-[11px] text-gray-500 font-light mt-0.5">{bp.landmark}</p>
                      </div>
                    </div>

                    <span className="font-mono font-medium text-xs sm:text-sm text-gray-900 shrink-0">
                      {bp.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dropping Points */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-50 text-[#d84e55] font-semibold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="font-medium text-gray-900 text-sm">
                  Select Dropping Point ({bus.destinationCity})
                </h3>
              </div>
              <span className="text-[11px] text-gray-400 font-light">Dropoff</span>
            </div>

            <div className="space-y-2.5">
              {(bus.droppingPoints || []).map((dp) => {
                const isChecked = selectedDropping?.id === dp.id;
                return (
                  <div
                    key={dp.id}
                    onClick={() => onSelectDropping(dp)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isChecked
                        ? 'border-[#d84e55] bg-[#fff8f8] shadow-sm ring-1 ring-[#d84e55]'
                        : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isChecked
                              ? 'border-[#d84e55] bg-[#d84e55]'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 text-xs sm:text-sm">{dp.name}</h4>
                        <p className="text-[11px] text-gray-500 font-light mt-0.5">{dp.landmark}</p>
                      </div>
                    </div>

                    <span className="font-mono font-medium text-xs sm:text-sm text-gray-900 shrink-0">
                      {dp.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-left w-full sm:w-auto">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium text-gray-800">
                Boarding: {selectedBoarding.name} ({selectedBoarding.time})
              </span>
              <span>•</span>
              <span className="font-medium text-gray-800">
                Dropping: {selectedDropping.name} ({selectedDropping.time})
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900 font-mono">
                ₹{totalFare}
              </span>
              <span className="text-xs text-gray-400 font-light">
                for {selectedSeats.length} {selectedSeats.length === 1 ? 'seat' : 'seats'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onProceedToPassengers}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#d84e55] hover:bg-[#c13a40] active:bg-[#a92b31] text-white font-semibold text-xs rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>Proceed to Passenger Details</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </main>
  );
};
