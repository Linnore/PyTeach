'use client';

import {
  AcademicCapIcon,
  DocumentDuplicateIcon,
  HomeIcon,
  PowerIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { lusitana } from '@/app/ui/fonts';

// Map of links to display in the side navigation.
const links = [
  { name: 'Home', href: '/home', icon: HomeIcon },
  { name: 'Lecture 1: Hello Python', href: '/lecture1', icon: DocumentDuplicateIcon },
  { name: 'Lecture 2: Strings', href: '/lecture2', icon: DocumentDuplicateIcon },
  { name: 'Lecture 3: Numbers', href: '/lecture3', icon: DocumentDuplicateIcon },
  { name: 'Lecture 4: Lists', href: '/lecture4', icon: DocumentDuplicateIcon },
  { name: 'Lecture 5: Variables', href: '/lecture5', icon: DocumentDuplicateIcon },
  { name: 'Lecture 6: Logical Conditions and Booleans', href: '/lecture6', icon: DocumentDuplicateIcon },
  { name: 'Lecture 7: If Statements', href: '/lecture7', icon: DocumentDuplicateIcon },
  { name: 'Lecture 8: For Loops', href: '/lecture8', icon: DocumentDuplicateIcon },
  { name: 'Lecture 9: Range', href: '/lecture9', icon: DocumentDuplicateIcon },
  { name: 'Lecture 10: Function', href: '/lecture10', icon: DocumentDuplicateIcon },
  { name: 'Lecture 11: Write Functions', href: '/lecture11', icon: DocumentDuplicateIcon },
  { name: 'Lecture 12: Final Projects', href: '/lecture12', icon: DocumentDuplicateIcon },
];

// PyTeach Logo Component
function PyteachLogo() {
  return (
    <Link className="mb-2 flex h-20 items-end justify-start rounded-md bg-green-600 p-4 md:h-40" href="/">
      <div className={`${lusitana.className} flex flex-row items-center leading-none text-white`}>
        <AcademicCapIcon className="h-12 w-12 rotate-[15deg]" />
        <p className="text-[44px]">PyTeach</p>
      </div>
    </Link>
  );
}

// NavLinks Component
function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-green-100 hover:text-green-600 md:flex-none md:justify-start md:p-2 md:px-3',
              { 'bg-green-100 text-green-600': pathname === link.href },
            )}
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}

// Sign Out Button Component
function SignOutButton() {
  return (
    <button className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-green-100 hover:text-green-600 md:flex-none md:justify-start md:p-2 md:px-3">
      <PowerIcon className="w-6" />
      <div className="hidden md:block">Sign Out</div>
    </button>
  );
}

// SideNav Component
export default function SideNav() {
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <PyteachLogo />

      <div className="flex-grow">
        <NavLinks />
      </div>

      {/* Sign Out button */}
      <SignOutButton />
    </div>
  );
}