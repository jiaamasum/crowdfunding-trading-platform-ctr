import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    question: 'What is CrowdFund?',
    answer: 'CrowdFund is a crowdfunding platform that connects investors with vetted projects seeking funding. We enable fractional ownership, making quality investments accessible to everyone.',
  },
  {
    question: 'How do I start investing?',
    answer: 'Simply create a free account, browse our available projects, and invest in the ones that align with your goals. You can start with as little as $50.',
  },
  {
    question: 'What types of projects can I invest in?',
    answer: 'We offer projects across multiple sectors including technology, real estate, healthcare, energy, agriculture, and manufacturing.',
  },
  {
    question: 'How are projects vetted?',
    answer: 'Every project goes through a rigorous review process by our team. We evaluate the team, business model, financials, and potential risks before approval.',
  },
  {
    question: 'What are the risks of investing?',
    answer: 'All investments carry risk, including the potential loss of your entire investment. Projects may fail or underperform. We recommend diversifying across multiple projects.',
  },
  {
    question: 'How do I receive returns?',
    answer: "Returns depend on the project type. Some projects offer dividends, while others may provide returns upon exit or sale. Details are specified in each project's offering documents.",
  },
  {
    question: 'Can I sell my shares?',
    answer: "Crowdfunding investments are typically illiquid. While we're working on a secondary marketplace, you should be prepared to hold your investment for the project's full term.",
  },
  {
    question: 'How do developers submit projects?',
    answer: 'Developers can create a free account and submit their projects for review. Our team will guide you through the process and help you create a compelling offering.',
  },
];

export default function FAQ() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-display font-bold mb-6">Frequently Asked Questions</h1>
        <p className="text-xl text-muted-foreground">
          Find answers to common questions about investing on CrowdFund.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="max-w-3xl mx-auto mt-12 text-center">
        <p className="text-muted-foreground mb-4">
          Still have questions?
        </p>
        <Link to="/contact">
          <Button variant="outline">Contact Support</Button>
        </Link>
      </div>
    </div>
  );
}
