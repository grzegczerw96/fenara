# Fenara — okna i drzwi aluminiowe

Koncepcyjna strona marki **Fenara** (marka fikcyjna) — stolarka aluminiowa premium.
Projekt powstał w Figmie (desktop 1440 / mobile 390 + biblioteka komponentów), a ta wersja to statyczna implementacja z animacjami.

**Demo:** https://grzegczerw96.github.io/fenara/

## Technologia
- HTML + CSS (tokeny 1:1 z biblioteki w Figmie), bez frameworka i bez builda
- [GSAP 3.13](https://gsap.com/) — ScrollTrigger, SplitText
- [Lenis](https://github.com/darkroomengineering/lenis) — płynne przewijanie
- Biblioteki w `vendor/` (wersje przypięte, bez zależności od CDN)

## Ruch i interakcje
- intro hero (odsłonięcie karty, maskowane linie nagłówka), parallax i „oddalenie” karty przy przewijaniu
- manifest odsłaniany słowo po słowie, liczniki
- usługi: zakładki i miniatury z przejściem zdjęć
- realizacje: porównanie wizualizacja/realizacja (przeciąganie, klawiatura), 3 projekty
- proces: sekcja przypięta, karty przewijane w poziomie
- korzyści: cała strona przechodzi w ciemny motyw, punkty podświetlane przy przewijaniu
- opinie: dwa nieskończone rzędy (pauza na hover, przyspieszenie przy szybkim scrollu)
- formularz z walidacją i stanem „wysłano” (demo — nic nie jest wysyłane)
- hover: rolowane etykiety przycisków, magnetyczne przyciski, kontekstowy kursor

## Dostępność
Strona respektuje ustawienie systemowe **„ogranicz animacje”** (`prefers-reduced-motion`) — wtedy treść jest statyczna,
a wszystkie funkcje (zakładki, porównanie, formularz, menu) nadal działają.
Aby obejrzeć animacje mimo tego ustawienia, dodaj do adresu `?motion=1`.

## Lokalnie
```bash
py -m http.server 5500
```
i otwórz http://localhost:5500
