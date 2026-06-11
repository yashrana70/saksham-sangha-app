import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, BookOpen, QrCode, ExternalLink, IndianRupee } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const books = [
  { id: 1, title: "Shrila Prabhupada's Small Books", image: "/book-small.jpg", price: "₹51" },
  { id: 2, title: "Bhakti Vriksha lvl-1 Books", image: "/book-lvl1.jpg", price: "₹251" },
  { id: 3, title: "Bhakti Vriksha lvl-2 Books", image: "/book-lvl2.jpg", price: "₹251" },
  { id: 4, title: "Bhagavad Gita As It Is", image: "/book-gita.jpg", price: "₹251" },
];

export default function Donation() {
  const { t } = useI18n();
  const { session } = useAuth();
  const [selectedBook, setSelectedBook] = useState<typeof books[0] | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBuyClick = (book: typeof books[0]) => {
    setSelectedBook(book);
    setShowPayment(true);
  };

  const handlePaymentSubmit = async () => {
    if (!transactionId.trim()) {
      toast.error("Please enter a Transaction ID");
      return;
    }
    setIsSubmitting(true);
    
    // Simulate saving to backend (We will create this table soon)
    try {
      const { error } = await supabase.from('book_purchases').insert([
        {
          user_id: session?.user.id,
          book_title: selectedBook?.title,
          amount: selectedBook?.price,
          transaction_id: transactionId,
          status: 'pending'
        }
      ]);
      
      if (error) {
        console.error(error);
        toast.error("Failed to submit payment details");
      } else {
        toast.success("Payment details submitted successfully! Admin will verify soon.");
        setShowPayment(false);
        setTransactionId("");
        setSelectedBook(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col items-center justify-center text-center space-y-2 py-6 bg-primary/5 rounded-2xl border border-primary/10">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Support Our Mission</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Help us distribute transcendental literature and support the temple. Select a book bundle below to donate and receive spiritual knowledge!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {books.map((book) => (
          <Card key={book.id} className="overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group flex flex-col h-full">
            <div className="h-48 overflow-hidden bg-muted relative">
              <img 
                src={book.image} 
                alt={book.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute top-2 right-2 bg-background/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-primary shadow-sm border border-primary/20">
                {book.price}
              </div>
            </div>
            <CardHeader className="flex-1 pb-4">
              <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">{book.title}</CardTitle>
            </CardHeader>
            <CardFooter className="pt-0 mt-auto">
              <Button onClick={() => handleBuyClick(book)} className="w-full gap-2 shadow-md">
                <BookOpen className="w-4 h-4" />
                Purchase & Donate
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-center">Complete Your Donation</DialogTitle>
            <DialogDescription className="text-center">
              You are purchasing <strong>{selectedBook?.title}</strong> for <strong className="text-primary">{selectedBook?.price}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-6 py-4">
            {/* Placeholder for QR Code */}
            <div className="bg-muted w-48 h-48 rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
              <QrCode className="w-12 h-12 text-primary/40 mb-2" />
              <span className="text-sm text-muted-foreground font-medium px-4 text-center">
                QR Code Placeholder<br/>(Send image later)
              </span>
            </div>

            <Button variant="outline" className="w-full max-w-[250px] gap-2 border-primary/20 hover:bg-primary/5" asChild>
              <a href="#" target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4" />
                Pay via Razorpay Link
              </a>
            </Button>
            
            <div className="w-full pt-4 border-t border-border">
              <Label htmlFor="txId" className="mb-2 block text-sm font-medium">Have you paid? Enter Transaction ID below:</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="txId" 
                    placeholder="e.g. pay_L7xZ12..." 
                    className="pl-9"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>
                <Button onClick={handlePaymentSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 text-center">
                Your purchase history will be saved securely and verified by Temple Admin.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
