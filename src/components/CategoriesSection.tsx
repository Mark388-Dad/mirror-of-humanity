import { 
  Crown, MapPin, Users, Film, Bookmark, User, Heart, 
  Image, History, Map, BookX, Pen, Library, School, 
  Sparkles, Rocket, Hash, Wand2, UserCircle, UsersRound,
  Globe, Smile, Shuffle, BookHeart, Sun, Palette, 
  GraduationCap, Mountain, Footprints, Dumbbell
} from "lucide-react";

const categories = [
  { id: 1, name: "A Book About Leadership", icon: Crown },
  { id: 2, name: "A Book Set in a Country You Have Never Visited", icon: MapPin },
  { id: 3, name: "A Book Recommended by a Friend", icon: Users },
  { id: 4, name: "A Book Adapted into a Movie or TV Show", icon: Film },
  { id: 5, name: "A Book You Started But Never Finished", icon: Bookmark },
  { id: 6, name: "A Book with a Protagonist of the Opposite Gender", icon: User },
  { id: 7, name: "A Book That Made You Cry", icon: Heart },
  { id: 8, name: "A Graphic Novel or Comic Book", icon: Image },
  { id: 9, name: "A Book Based on True Events", icon: History },
  { id: 10, name: "A Book Set in Kenya", icon: Map },
  { id: 11, name: "A Book in A Genre You Never Read", icon: BookX },
  { id: 12, name: "A Memoir", icon: Pen },
  { id: 13, name: "A Book That is Part of a Series", icon: Library },
  { id: 14, name: "A Book Set in a School", icon: School },
  { id: 15, name: "Free Choice", icon: Sparkles },
  { id: 16, name: "A Sci-Fi or Futuristic Book", icon: Rocket },
  { id: 17, name: "A Book with a Number in the Title", icon: Hash },
  { id: 18, name: "A Fantasy Book", icon: Wand2 },
  { id: 19, name: "A Book with a Strong Female Lead", icon: UserCircle },
  { id: 20, name: "A Book About Friendship", icon: UsersRound },
  { id: 21, name: "A Book Set on a Different Continent", icon: Globe },
  { id: 22, name: "A Book That Made You Laugh", icon: Smile },
  { id: 23, name: "A Book with a Plot Twist", icon: Shuffle },
  { id: 24, name: "A Collection of Poems", icon: BookHeart },
  { id: 25, name: "A Book with a Happy Ending", icon: Sun },
  { id: 26, name: "A Book You Chose for Its Cover", icon: Palette },
  { id: 27, name: "A Book with a Moral Lesson", icon: GraduationCap },
  { id: 28, name: "A Book About Overcoming Challenges", icon: Mountain },
  { id: 29, name: "A Book Featuring Diverse Characters", icon: Footprints },
  { id: 30, name: "A Book About Sports", icon: Dumbbell },
];

const CategoriesSection = () => {
  return (
    <section id="categories" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            30 Reading Categories
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Choose from fiction, non-fiction, poetry, or plays — any work that reflects an aspect of the human experience. 
            Read one book from each category, then choose 15 more from any category (max 2 per category).
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((category) => (
            <div 
              key={category.id}
              className="group p-5 rounded-xl bg-card hover:bg-gold/5 border border-border hover:border-gold/30 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors">
                  <category.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-medium">#{category.id}</span>
                  <h3 className="text-sm font-medium text-foreground leading-tight mt-1 group-hover:text-gold-dark transition-colors">
                    {category.name}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
