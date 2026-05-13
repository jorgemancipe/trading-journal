export function useTrades() {
  const context = useContext(TradesContext);

  // ✅ During build / prerender, context can be null
  if (!context) {
    return {
      trades: [],
      addTrade: () => {},
      clearTrades: () => {},
    };
  }

  return context;
}
