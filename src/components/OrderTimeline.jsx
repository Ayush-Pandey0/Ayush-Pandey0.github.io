import { Package, Clock, CheckCircle, Truck, MapPin, XCircle, ShoppingBag } from 'lucide-react';

// Order status steps in sequence
const orderSteps = [
  { key: 'processing', label: 'Order Placed', icon: ShoppingBag, description: 'Your order has been placed' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, description: 'Order confirmed by seller' },
  { key: 'shipped', label: 'Shipped', icon: Package, description: 'Package has been shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, description: 'Package is out for delivery' },
  { key: 'delivered', label: 'Delivered', icon: MapPin, description: 'Package delivered successfully' },
];

export default function OrderTimeline({ status, tracking, orderDate, compact = false }) {
  const currentStatus = status?.toLowerCase();
  const isCancelled = currentStatus === 'cancelled';
  
  // Find current step index
  const currentStepIndex = orderSteps.findIndex(step => step.key === currentStatus);
  
  // For cancelled orders, show different timeline
  if (isCancelled) {
    return (
      <div className={`${compact ? 'py-3' : 'py-6'}`}>
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="mt-2 text-sm font-semibold text-red-600">Order Cancelled</p>
            <p className="text-xs text-gray-500 mt-1">This order has been cancelled</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${compact ? 'py-3' : 'py-6'}`}>
      {/* Desktop Timeline - Horizontal */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Progress Line Background */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full" />
          
          {/* Progress Line Active */}
          <div 
            className="absolute top-6 left-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
            style={{ 
              width: currentStepIndex >= 0 
                ? `${(currentStepIndex / (orderSteps.length - 1)) * 100}%` 
                : '0%' 
            }}
          />
          
          {/* Steps */}
          <div className="relative flex justify-between">
            {orderSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const StepIcon = step.icon;
              
              return (
                <div key={step.key} className="flex flex-col items-center" style={{ width: '20%' }}>
                  {/* Icon Circle */}
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-400'
                    } ${isCurrent ? 'ring-4 ring-cyan-200 scale-110' : ''}`}
                  >
                    <StepIcon className="w-5 h-5" />
                  </div>
                  
                  {/* Label */}
                  <p className={`mt-3 text-xs font-semibold text-center ${
                    isCompleted ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  
                  {/* Description - only show for current step */}
                  {isCurrent && !compact && (
                    <p className="text-xs text-cyan-600 text-center mt-1 max-w-[100px]">
                      {step.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Tracking Info */}
        {tracking && (tracking.currentLocation || tracking.carrier || tracking.estimatedDelivery) && !compact && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex flex-wrap gap-6 text-sm">
              {tracking.carrier && (
                <div>
                  <span className="text-gray-500">Carrier:</span>
                  <span className="ml-2 font-medium text-gray-900">{tracking.carrier}</span>
                </div>
              )}
              {tracking.currentLocation && (
                <div>
                  <span className="text-gray-500">Current Location:</span>
                  <span className="ml-2 font-medium text-gray-900">{tracking.currentLocation}</span>
                </div>
              )}
              {tracking.estimatedDelivery && (
                <div>
                  <span className="text-gray-500">Expected Delivery:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {new Date(tracking.estimatedDelivery).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Timeline - Vertical */}
      <div className="md:hidden">
        <div className="relative pl-8">
          {/* Vertical Line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
          
          {/* Active Line */}
          <div 
            className="absolute left-3 top-0 w-0.5 bg-gradient-to-b from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ 
              height: currentStepIndex >= 0 
                ? `${((currentStepIndex + 1) / orderSteps.length) * 100}%` 
                : '0%' 
            }}
          />
          
          {/* Steps */}
          <div className="space-y-6">
            {orderSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const StepIcon = step.icon;
              
              return (
                <div key={step.key} className="relative flex items-start">
                  {/* Icon */}
                  <div 
                    className={`absolute -left-5 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isCompleted 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-400'
                    } ${isCurrent ? 'ring-2 ring-cyan-200' : ''}`}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>
                  
                  {/* Content */}
                  <div className="ml-4">
                    <p className={`text-sm font-semibold ${
                      isCompleted ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-cyan-600 mt-0.5">{step.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Tracking Info - Mobile */}
        {tracking && (tracking.currentLocation || tracking.carrier || tracking.estimatedDelivery) && !compact && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
            {tracking.carrier && (
              <p className="text-gray-600">
                <span className="font-medium">Carrier:</span> {tracking.carrier}
              </p>
            )}
            {tracking.currentLocation && (
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Location:</span> {tracking.currentLocation}
              </p>
            )}
            {tracking.estimatedDelivery && (
              <p className="text-green-600 mt-1">
                <span className="font-medium">Expected:</span> {new Date(tracking.estimatedDelivery).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short'
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
