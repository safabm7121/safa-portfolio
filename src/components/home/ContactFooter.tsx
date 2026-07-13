const WDTH = { fontVariationSettings: '"wdth" 120' } as const;
const BIG =
  "font-bold text-[7.2svw] lg:text-[6svw] 2xl:text-[5svw] xl:text-[5.6svw] uppercase leading-none";

const CONTACT_LINK =
  "block before:absolute relative before:inset-0 p-2 lg:hover:before:border-l1 before:border-2 " +
  "before:border-transparent active:before:border-l1 before:border-dotted uppercase before:content-[''] " +
  "before:transition-colors before:duration-200 cursor-pointer pointer-events-auto before:pointer-events-none";

export function ContactFooter() {
  return (
    <footer
      id="contact"
      className="z-10 relative flex flex-col justify-center p-6 lg:p-16 w-full h-dvh lg:h-screen pointer-events-none"
    >
      <div className={`gap-2 grid grid-cols-12 ${BIG}`} style={WDTH}>
        <span className="col-span-6 md:col-span-5 xl:col-span-4 md:col-start-2 xl:col-start-3 text-left pointer-events-auto">
          <span>Let&rsquo;s</span>
        </span>
        <span className="col-span-6 md:col-span-5 xl:col-span-4 text-right pointer-events-auto">
          <span>Create</span>
        </span>
      </div>
      <div className={`gap-2 grid grid-cols-12 ${BIG}`} style={WDTH}>
        <span className="col-span-12 md:col-start-2 xl:col-start-3 text-left pointer-events-auto">
          <span>Something</span>
        </span>
      </div>
      <div className={`gap-2 grid grid-cols-12 ${BIG}`} style={WDTH}>
        <span className="col-span-12 md:col-end-12 xl:col-end-11 text-right pointer-events-auto">
          <span>Extraordinary</span>
        </span>
      </div>

      <div className="absolute inset-0 flex flex-col justify-end px-4 lg:px-14 py-18 lg:py-24 font-mono-2 text-sm lg:text-base">
        <div className="flex lg:flex-row flex-col justify-between w-full">
          <a className={CONTACT_LINK} href="mailto:safabenmiledd@gmail.com">
            <span>safabenmiledd@gmail.com</span>
          </a>
          <div className="flex flex-row items-center gap-2 lg:gap-4">
           
            <a className={CONTACT_LINK} target="_blank" rel="noopener noreferrer" href="https://www.figma.com/@wenhaoqi">
              <span>behance</span>
            </a>
            <a className={CONTACT_LINK} target="_blank" rel="noopener noreferrer" href="https://store.voidstonestudio.com">
              <span>VOIDSTONE STUDIO</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
