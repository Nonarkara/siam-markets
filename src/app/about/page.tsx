import { PageTitle } from "../../components/Nav/LegalFooter";
         import { AboutSection } from "../../components/About/AboutSection";

         export default function AboutPage() {
           return (
             <div className="container">
               <PageTitle title="About" />
               <h1>About Us</h1>
               <p>This is the about page for your day trading dashboard.</p>
               <AboutSection />
             </div>
           );
         }