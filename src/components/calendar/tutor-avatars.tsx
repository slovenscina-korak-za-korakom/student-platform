"use client"
import React, {useRef, useState} from "react";
import {createPortal} from "react-dom";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Tutor} from "@/components/calendar/types";
import {cn} from "@/lib/utils";
import {useSidebar} from "@/components/ui/sidebar";
import {useLocale, useTranslations} from "next-intl";

interface TutorAvatarsProps {
  tutors: Tutor[],
  preferredTutorId: number | null,
  selectedTutorId: number | null,
  disabled?: boolean,
  setBooked?: (showBookedSessions: boolean) => void,
  onTutorSelect?: (tutorId: number) => void,
}

export const TutorAvatars: React.FC<TutorAvatarsProps> = ({
                                                            tutors,
                                                            preferredTutorId,
                                                            selectedTutorId,
                                                            disabled,
                                                            setBooked,
                                                            onTutorSelect,
                                                          }) => {
  const {isMobile} = useSidebar()
  const locale = useLocale()
  const t = useTranslations("calendar.controls.speaking-tutor");
  const MANCA_BIO = {
    "en": "My name is Manca, I am 23 years old and I teach Slovenian. I grew up in Koper, and now I live in Ljubljana, where I am studying for a master's degree at the Faculty of Economics. I also spent part of my studies abroad, which further strengthened my interest in languages. I am a responsible, empathetic and organized person who believes that learning a language is primarily a process of building self-confidence. I am very happy to see students start to converse in Slovenian, solve tasks confidently and gradually believe in themselves. Although I do not speak Russian, I can talk to my native Slovenian speaker about various topics, from everyday life, travel, family to culture and life in Slovenia. I can adapt the lessons to your wishes, and we can also solve tasks together and consolidate our knowledge. If you already have basic knowledge of Slovenian and want to improve it in a relaxed and pleasant environment, lessons with me are the right choice.",
    "sl": "Ime mi je Manca, stara sem 23 let in učim slovenščino. Odraščala sem v Kopru, zdaj pa živim v Ljubljani, kjer obiskujem magistrski študij na Ekonomski fakulteti. Del študija sem preživela tudi v tujini, kar je še okrepilo moje zanimanje za jezike. Sem odgovorna, empatična in organizirana oseba, ki verjame, da je učenje jezika predvsem proces grajenja samozavesti. Zelo lepo mi je videti, ko se učenci začnejo sproščeno pogovarjati v slovenščini, samozavestno reševati naloge in postopoma verjeti vase. Ruščine sicer ne govorim, vendar se lahko pri urah z mano kot naravno govorko slovenščine pogovarjamo o različnih temah, od vsakdanjega življenja, potovanj, družine do kulture in življenja v Sloveniji. Ure prilagodim vašim željam, lahko pa tudi skupaj rešujemo naloge in utrjujemo znanje. Če že imate osnovno znanje slovenščine in ga želite izboljšati v sproščenem in prijetnem okolju, so ure z mano prava izbira",
    "ru": "Меня зовут Манца, мне 23 года, и я преподаю словенский язык. Я выросла в Копере, а сейчас живу в Любляне, где обучаюсь в магистратуре на Экономическом факультете. Часть учёбы я провела за границей, что ещё больше усилило мой интерес к языкам. Я ответственная, эмпатичная и организованная, и считаю, что изучение языка — это прежде всего процесс формирования уверенности в себе. Мне очень приятно видеть, как ученики начинают свободно говорить по-словенски, уверенно выполнять задания и постепенно верить в себя. Русский язык я не говорю, но на занятиях со мной как с носителем словенского языка мы можем обсуждать разные темы — от повседневной жизни, путешествий и семьи до культуры и жизни в Словении. Я адаптирую занятия под ваши пожелания, можем вместе выполнять задания и закреплять знания. Если у вас уже есть базовый уровень словенского и вы хотите его улучшить в спокойной и приятной атмосфере, занятия со мной — отличный выбор.",
    "it": "Mi chiamo Manca, ho 23 anni e insegno sloveno. Sono cresciuto a Capodistria e ora vivo a Lubiana, dove sto studiando per un master presso la Facoltà di Economia. Ho trascorso parte dei miei studi anche all'estero, cosa che ha ulteriormente rafforzato il mio interesse per le lingue. Sono una persona responsabile, empatica e organizzata che crede che l'apprendimento di una lingua sia principalmente un processo di costruzione della fiducia in se stessi. Sono molto felice di vedere gli studenti iniziare a conversare in sloveno, risolvere i compiti con sicurezza e gradualmente credere in se stessi. Anche se non parlo russo, posso parlare con il mio madrelingua sloveno di vari argomenti, dalla vita quotidiana, ai viaggi, alla famiglia, alla cultura e alla vita in Slovenia. Posso adattare le lezioni ai tuoi desideri e possiamo anche risolvere insieme compiti e consolidare le nostre conoscenze. Se hai già una conoscenza base dello sloveno e vuoi migliorarla in un ambiente rilassato e piacevole, le lezioni con me sono la scelta giusta.",
  }
  const speakingTutorIds = process.env.NEXT_PUBLIC_SPEAKING_TUTORS?.split(",").map(Number) ?? []
  const shownTutors = [...new Set([...speakingTutorIds, ...(preferredTutorId != null ? [preferredTutorId] : [])])]

  const [popoverTutorId, setPopoverTutorId] = useState<number | null>(null)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left?: number; right?: number }>({top: 0})
  const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map())

  const handleMouseEnter = (tutorId: number, index: number) => {
    const btn = buttonRefs.current.get(tutorId)
    if (btn) {
      const rect = btn.getBoundingClientRect()
      const alignRight = index >= shownTutors.length - 1
      setPopoverPos(alignRight
        ? {top: rect.bottom + 8, right: window.innerWidth - rect.right}
        : {top: rect.bottom + 8, left: rect.left}
      )
    }
    setPopoverTutorId(tutorId)
  }

  return (
    <div className="flex items-center">
      <div className="flex items-end gap-2">
        {/* Selected Tutor Avatar */}
        <div className={"flex flex-row lg:gap-1 items-center justify-center"}>
          {tutors.filter((tutor) => shownTutors.includes(tutor.id)).map((tutor, index) => {
            const isSpeakingTutor = speakingTutorIds.includes(tutor.id);
            return (
              <Button
                key={tutor.id}
                ref={(el) => {
                  if (el) buttonRefs.current.set(tutor.id, el); else buttonRefs.current.delete(tutor.id);
                }}
                size="sm"
                variant={"link"}
                onClick={() => {
                  setBooked?.(false);
                  onTutorSelect?.(tutor.id);
                }}
                onMouseEnter={() => isSpeakingTutor && handleMouseEnter(tutor.id, index)}
                onMouseLeave={() => setPopoverTutorId(null)}
                className={"relative h-fit w-fit lg:w-36 p-0 rounded-full flex flex-row items-center justify-center translate-y-2 gap-2 hover:no-underline cursor-pointer"}
              >
                <Avatar className="h-8 w-8 rounded-full border-[1px] border-white lg:border-none" style={{
                  border: isSpeakingTutor ? "2px solid var(--color-blue-400)" : "none",
                  filter: isSpeakingTutor ? "drop-shadow(0 0 0.75rem var(--color-blue-400)" : "none",
                  translate: isMobile ? (-index * 10).toString() + "px" : "none",
                  zIndex: index
                }}>
                  <AvatarImage src={tutor.avatar} alt={tutor.name}/>
                  <AvatarFallback className="text-base bg-foreground/50 text-background">
                    {tutor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span className={cn(
                  "hidden capitalize lg:block text-sm text-muted-foreground text-center truncate",
                  selectedTutorId === tutor.id && !disabled && "text-indigo-500 font-semibold",
                  selectedTutorId === tutor.id && !disabled && isSpeakingTutor && "text-blue-400 font-semibold"
                )}>
              {tutor.name.split(" ")[0]}
            </span>
                <div style={{
                  translate: isMobile ? (-index * 10).toString() + "px" : "none",
                }} className={cn(
                  "w-full translate-y-[1px] h-[2px] bg-indigo-500 absolute -bottom-[11px] opacity-0 transition-opacity duration-300",
                  selectedTutorId === tutor.id && !disabled && "opacity-100 bg-indigo-500",
                  selectedTutorId === tutor.id && !disabled && isSpeakingTutor && "opacity-100 bg-blue-400",
                )}/>
                <div style={{
                  translate: isMobile ? (-index * 10).toString() + "px" : "none",
                }} className={cn(
                  "lg:hidden capitalize text-xs whitespace-nowrap text-indigo-500 absolute -bottom-8 opacity-0 transition-opacity duration-300",
                  selectedTutorId === tutor.id && !disabled && "opacity-100",
                  index >= tutors.length - 2 ? "right-0" : "left-0"
                )}>
                  {tutor.name.split(" ")[0]}
                </div>
              </Button>
            )
          })}
        </div>
      </div>
      {popoverTutorId !== null && typeof document !== "undefined" && createPortal(
        <div
          className="fixed w-2xl rounded-md border border-blue-400/30 bg-background px-3 py-2 text-sm text-muted-foreground shadow-md pointer-events-none"
          style={{top: popoverPos.top, left: popoverPos.left, right: popoverPos.right, zIndex: 9999}}
        >
          <p className="font-semibold text-blue-400 mb-1">{t("title")}</p>
          <p>{t("desc")}</p>
          <br/>
          <p className="font-semibold text-blue-400 mb-1">Bio</p>
          <p>{MANCA_BIO[locale]}</p>
        </div>,
        document.body
      )}
    </div>
  );
};
