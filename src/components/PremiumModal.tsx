import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Crown, 
  Star, 
  Check, 
  Zap, 
  Users, 
  Shield, 
  MessageSquare,
  Palette
} from "lucide-react";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (plan: 'monthly' | 'yearly') => void;
  currentPlan?: 'free' | 'monthly' | 'yearly';
}

export const PremiumModal = ({ isOpen, onClose, onSubscribe, currentPlan = 'free' }: PremiumModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const premiumFeatures = [
    { icon: Users, text: "Create unlimited private groups", premium: true },
    { icon: Shield, text: "Ad-free experience - No advertisements", premium: true },
    { icon: Crown, text: "Premium badge ⭐ & profile themes", premium: true },
    { icon: MessageSquare, text: "Priority customer support", premium: true },
    { icon: Zap, text: "Advanced chat features & emojis", premium: true },
    { icon: Shield, text: "Enhanced privacy controls", premium: true },
    { icon: Palette, text: "Custom chat themes & colors", premium: true },
    { icon: Star, text: "Early access to new features", premium: true },
  ];

  const plans = {
    monthly: {
      price: "₹99",
      period: "month",
      savings: null,
      popular: false
    },
    yearly: {
      price: "₹999",
      period: "year",
      savings: "Save ₹189",
      popular: true
    }
  };

  const handleSubscribe = () => {
    onSubscribe(selectedPlan);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="w-6 h-6 text-yellow-500" />
            ChitZ Premium
            <Star className="w-5 h-5 text-purple-500 fill-purple-500 premium-star" />
          </DialogTitle>
          <div className="text-center mt-2">
            <p className="text-muted-foreground">
              Unlock premium features and enjoy an <span className="font-semibold text-primary">ad-free experience</span>
            </p>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {currentPlan !== 'free' && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Crown className="w-4 h-4" />
                <span className="font-medium">
                  You're currently on the {currentPlan} plan
                </span>
                <Star className="w-4 h-4 text-purple-500 fill-purple-500 premium-star" />
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Monthly Plan */}
            <Card 
              className={`cursor-pointer transition-all ${
                selectedPlan === 'monthly' 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedPlan('monthly')}
            >
              <CardHeader className="text-center">
                <CardTitle className="text-lg">Monthly Plan</CardTitle>
                <div className="text-3xl font-bold text-primary">
                  {plans.monthly.price}
                  <span className="text-lg font-normal text-muted-foreground">/month</span>
                </div>
              </CardHeader>
            </Card>

          {/* Yearly Plan */}
          <Card 
            className={`cursor-pointer transition-all relative ${
              selectedPlan === 'yearly' 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedPlan('yearly')}
          >
            {plans.yearly.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                Most Popular
              </Badge>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Yearly Plan</CardTitle>
              <div className="text-3xl font-bold text-primary">
                {plans.yearly.price}
                <span className="text-lg font-normal text-muted-foreground">/year</span>
              </div>
              {plans.yearly.savings && (
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {plans.yearly.savings}
                </div>
              )}
            </CardHeader>
          </Card>
        </div>

        {/* Special Ad-Free Highlight */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-green-600" />
            <h3 className="font-bold text-green-700 dark:text-green-300">🚫 Ad-Free Experience</h3>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400">
            No more interruptions! Premium users enjoy a completely ad-free experience across the entire platform. 
            Focus on chatting without any distractions.
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg mb-3">All Premium Features:</h3>
          {premiumFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <IconComponent className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">{feature.text}</span>
              </div>
            );
          })}
        </div>
        </div>

        {/* Subscribe Button - Fixed at bottom */}
        <div className="flex-shrink-0 border-t pt-4 space-y-4">
          {currentPlan === 'free' ? (
            <Button 
              onClick={handleSubscribe}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3"
              size="lg"
            >
              <Crown className="w-4 h-4 mr-2" />
              Get Ad-Free Premium - {plans[selectedPlan].price}/{plans[selectedPlan].period}
              <Star className="w-4 h-4 ml-2 premium-star" />
            </Button>
          ) : (
            <div className="text-center text-muted-foreground">
              <p>You're already enjoying Premium features!</p>
              <p className="text-sm text-green-600">Including ad-free experience 🎉</p>
            </div>
          )}
          
          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime. No hidden fees. Secure payment processing. <br/>
            <span className="text-green-600">✨ Instant ad removal upon subscription</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
