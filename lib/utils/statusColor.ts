const getStatusColor = (status: string) => {
  switch (status) {
    case 'cancelled':
      return 'destructive';
    case 'refunded':
      return 'outline';
    case 'completed':
      return 'default';
    default:
      return 'secondary';
  }
};

const getStatusDotColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'cancelled':
      return 'bg-red-500';
    case 'refunded':
      return 'bg-blue-500';
    default:
      return 'bg-gray-400';
  }
};

export { getStatusColor, getStatusDotColor };
