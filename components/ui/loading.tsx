"use client"


export default function UniqueCalorieLoadingAnimation() {
  

  const foodIcons = [
    { emoji: "🍎", name: "Apple", calories: 95 },
    { emoji: "🥑", name: "Avocado", calories: 234 },
    { emoji: "🥕", name: "Carrot", calories: 25 },
    { emoji: "🥬", name: "Lettuce", calories: 5 },
    { emoji: "🍌", name: "Banana", calories: 105 },
    { emoji: "🫐", name: "Blueberries", calories: 84 },
  ]




  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-8 h-screen">
      {/* Food Icons Circle */}
      <div className="relative w-64 h-64">
        {foodIcons.map((food, index) => {
          const angle = index * 60 - 90 // Start from top
          const radius = 100
          const x = Math.cos((angle * Math.PI) / 180) * radius
          const y = Math.sin((angle * Math.PI) / 180) * radius

          return (
            <div
              key={food.name}
              className="absolute w-12 h-12 flex items-center justify-center bg-card rounded-full shadow-lg border border-border transition-all duration-300 hover:scale-110 group"
              style={{
                left: `calc(50% + ${x}px - 24px)`,
                top: `calc(50% + ${y}px - 24px)`,
                animation: `bounce 2s ease-in-out infinite ${index * 0.2}s`,
              }}
            >
              <span className="text-2xl">{food.emoji}</span>

              {/* Calorie tooltip */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {food.calories} cal
              </div>
            </div>
          )
        })}

        {/* Central AI Processing Hub */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center relative">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-primary-foreground rounded-full animate-pulse"></div>
            </div>

            {/* AI Processing Lines */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-px h-8 bg-gradient-to-t from-primary to-transparent"
                style={{
                  transform: `rotate(${i * 60}deg) translateY(-40px)`,
                  animation: `pulse 1.5s ease-in-out infinite ${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>


      

      <style jsx>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
          }
          10%, 90% {
            opacity: 0.6;
          }
          50% {
            transform: translateY(0) translateX(20px);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}
