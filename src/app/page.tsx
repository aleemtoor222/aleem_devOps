import { hasExperience } from '@/content/derive';
import Hero from '@/components/hero/Hero';
import Pipeline from '@/components/Pipeline';
import Work from '@/components/work/Work';
import Stack from '@/components/Stack';
import Experience from '@/components/Experience';
import Contact from '@/components/contact/Contact';

// Recruiter-first order: Hero → How I ship → 01 Work → 02 Stack → 03 Experience → 04 Contact
export default function Home() {
  return (
    <>
      <Hero />
      <Pipeline />
      <Work />
      <Stack />
      {hasExperience && <Experience />}
      <Contact />
    </>
  );
}
