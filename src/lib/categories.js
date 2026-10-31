import {
  House, ShoppingCart, Car, HeartPulse, GraduationCap, Ticket, Briefcase, TrendingUp,
  Ellipsis, Utensils, Coffee, Plane, Laptop, BookOpen, Smartphone, ShieldCheck, Gift,
  PawPrint, Shirt, Dumbbell, Baby, Wifi, Zap, Fuel, Bus, Music, Gamepad2, Film, PiggyBank,
  Wallet, Landmark, CreditCard, Receipt, Tag, Pill, Sofa, Store, Heart,
} from "lucide-react"

export const ICONS = {
  house: House, cart: ShoppingCart, car: Car, health: HeartPulse, education: GraduationCap,
  ticket: Ticket, briefcase: Briefcase, trending: TrendingUp, more: Ellipsis, food: Utensils,
  coffee: Coffee, plane: Plane, laptop: Laptop, book: BookOpen, phone: Smartphone,
  shield: ShieldCheck, gift: Gift, pet: PawPrint, shirt: Shirt, gym: Dumbbell, baby: Baby,
  wifi: Wifi, energy: Zap, fuel: Fuel, bus: Bus, music: Music, games: Gamepad2, film: Film,
  piggy: PiggyBank, wallet: Wallet, bank: Landmark, card: CreditCard, receipt: Receipt,
  tag: Tag, pill: Pill, sofa: Sofa, store: Store, heart: Heart,
}

export const ICON_KEYS = Object.keys(ICONS)

// As 4 primeiras cores formam a paleta validada dos gráficos (daltonismo e contraste)
export const CATEGORY_COLORS = [
  "#3F6212", "#2F6FED", "#F2994A", "#9B6BD6",
  "#121212", "#0E9384", "#D6A21E", "#E04F8B", "#8A8A80",
]

export const FALLBACK_CATEGORY = "Outros"

export const DEFAULT_CATEGORIES = [
  { name: "Alimentação", icon: "cart", color: "#3F6212" },
  { name: "Moradia", icon: "house", color: "#2F6FED" },
  { name: "Transporte", icon: "car", color: "#F2994A" },
  { name: "Lazer", icon: "ticket", color: "#9B6BD6" },
  { name: "Saúde", icon: "health", color: "#E04F8B" },
  { name: "Educação", icon: "education", color: "#0E9384" },
  { name: "Salário", icon: "briefcase", color: "#3F6212" },
  { name: "Investimento", icon: "trending", color: "#D6A21E" },
  { name: "Outros", icon: "more", color: "#8A8A80" },
]

export function findCategory(categories, name) {
  return (
    categories.find((c) => c.name === name) ?? {
      name: name || FALLBACK_CATEGORY,
      icon: "tag",
      color: "#8A8A80",
    }
  )
}
