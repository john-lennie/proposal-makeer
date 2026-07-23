export type ProposalSectionId =
  | "cover"
  | "overview"
  | "objectives"
  | "scope"
  | "deliverables"
  | "timeline"
  | "pricing"
  | "terms"
  | "acceptance";

export interface ProposalSection {
  id: ProposalSectionId;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
}

export interface ScopeItem {
  number: string;
  title: string;
  description: string;
  includes: string[];
}

export interface TimelinePhase {
  date: string;
  title: string;
  description: string;
}

export interface PricingItem {
  label: string;
  detail: string;
  amount: number;
}

export interface DemoProposal {
  id: string;
  slug: string;
  title: string;
  client: string;
  clientLocation: string;
  company: string;
  companyTagline: string;
  revision: number;
  status: "draft" | "published" | "accepted" | "declined";
  updatedAt: string;
  validUntil: string;
  sections: ProposalSection[];
  objectives: string[];
  scope: ScopeItem[];
  deliverables: string[];
  timeline: TimelinePhase[];
  pricing: PricingItem[];
  terms: string[];
}

export const demoProposal: DemoProposal = {
  id: "demo",
  slug: "demo-proposal",
  title: "A considered move to Montréal",
  client: "Alder House",
  clientLocation: "Toronto → Montréal",
  company: "North & Finch",
  companyTagline: "Private moves, thoughtfully managed.",
  revision: 2,
  status: "published",
  updatedAt: "July 21, 2026",
  validUntil: "August 14, 2026",
  sections: [
    {
      id: "cover",
      label: "Cover",
      eyebrow: "Private relocation proposal",
      title: "A considered move, from first box to final detail.",
      body: "Prepared exclusively for Alder House for a private residential relocation from Toronto to Montréal.",
    },
    {
      id: "overview",
      label: "Project overview",
      eyebrow: "The brief",
      title: "Moving a home, not simply its contents.",
      body: "Alder House requires a discreet, meticulously coordinated relocation of a three-storey residence, art collection, and wine cellar. North & Finch will oversee every detail—from inventory and packing through placement and final styling—so the new home feels settled from the first evening.",
    },
    {
      id: "objectives",
      label: "Objectives",
      eyebrow: "Our priorities",
      title: "A seamless transition, handled with quiet precision.",
      body: "Every decision is guided by care, continuity, and a respect for the objects and routines that make a home personal.",
    },
    {
      id: "scope",
      label: "Scope of work",
      eyebrow: "Scope of work",
      title: "End-to-end stewardship.",
      body: "One experienced team will manage the move from initial planning to the final walk-through.",
    },
    {
      id: "deliverables",
      label: "Deliverables",
      eyebrow: "What you receive",
      title: "Everything required for a composed arrival.",
      body: "A clear, accountable set of services designed around the residence, collection, and schedule.",
    },
    {
      id: "timeline",
      label: "Timeline",
      eyebrow: "Proposed schedule",
      title: "Six weeks, carefully orchestrated.",
      body: "A paced plan creates room for considered decisions while keeping the relocation firmly on schedule.",
    },
    {
      id: "pricing",
      label: "Pricing",
      eyebrow: "Investment",
      title: "A complete, fixed-fee engagement.",
      body: "The investment reflects a dedicated team, specialist handling, and complete move management.",
    },
    {
      id: "terms",
      label: "Terms",
      eyebrow: "The details",
      title: "Clear terms, no surprises.",
      body: "A straightforward engagement designed to protect the schedule and the standard of care.",
    },
    {
      id: "acceptance",
      label: "Acceptance",
      eyebrow: "Begin the move",
      title: "We would be honoured to bring you home.",
      body: "Accept this proposal to reserve the North & Finch team for your September relocation.",
    },
  ],
  objectives: [
    "Protect every item through specialist packing and documented handling.",
    "Maintain privacy and discretion at both residences.",
    "Minimize disruption to the family’s daily routine.",
    "Deliver a fully placed, functional home by the agreed arrival date.",
  ],
  scope: [
    {
      number: "01",
      title: "Plan",
      description:
        "A detailed relocation plan built around your homes, collection, schedule, and preferences.",
      includes: ["On-site survey", "Room-by-room inventory", "Move-day plan"],
    },
    {
      number: "02",
      title: "Prepare",
      description:
        "Museum-standard packing and coordination for furnishings, artwork, wardrobe, and cellar.",
      includes: ["Custom crating", "Wardrobe packing", "Vendor coordination"],
    },
    {
      number: "03",
      title: "Relocate",
      description:
        "Dedicated transport, on-site supervision, and precise placement in the Montréal residence.",
      includes: ["Private fleet", "Floor protection", "Placement & styling"],
    },
  ],
  deliverables: [
    "Dedicated relocation director",
    "Digitized home inventory",
    "Custom art and object crating",
    "Full packing and unpacking",
    "Climate-controlled wine transport",
    "Furniture placement and styling",
    "Removal of all packing materials",
    "Final residence walk-through",
  ],
  timeline: [
    {
      date: "Aug 17–21",
      title: "Survey & planning",
      description: "Inventory, access review, and detailed relocation plan.",
    },
    {
      date: "Aug 31–Sep 4",
      title: "Specialist preparation",
      description: "Custom crating and advance packing for art and cellar.",
    },
    {
      date: "Sep 8–11",
      title: "Home packing",
      description: "Room-by-room packing with a dedicated residence team.",
    },
    {
      date: "Sep 14–16",
      title: "Move & settle",
      description: "Transport, placement, unpacking, and final styling.",
    },
  ],
  pricing: [
    {
      label: "Planning & move direction",
      detail: "Dedicated relocation director and planning",
      amount: 6200,
    },
    {
      label: "Packing & specialist handling",
      detail: "Materials, custom crating, art and cellar",
      amount: 14800,
    },
    {
      label: "Private transport",
      detail: "Dedicated fleet, insurance, and crew",
      amount: 11500,
    },
    {
      label: "Unpacking & residence setup",
      detail: "Placement, styling, and material removal",
      amount: 8500,
    },
  ],
  terms: [
    "A 40% retainer reserves the proposed dates.",
    "The remaining balance is due five business days before relocation.",
    "Pricing includes declared-value protection up to $500,000.",
    "Schedule changes require ten business days’ notice where possible.",
  ],
};

export const proposalSections = demoProposal.sections;

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);
}
