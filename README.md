# AR Control Panel

Panou de control curat pentru gestionarea experiențelor AR (tip Ember22).

## Ce poți face

- Încarci până la **10 poze** (target-uri)
- Încarci până la **10 video-uri**
- Creezi până la **10 experiențe** (perechi poză + video)
- Editezi oricând nume, număr, culoare, poză, video
- Generezi **QR code** pentru fiecare experiență
- Exporți totul într-un **zip** gata de pus pe GitHub Pages

## Cum rulezi

Deschide `index.html` în browser (sau servește folderul local).

## Flux recomandat

1. Încarcă pozele și video-urile în tab-ul **Asset-uri**
2. Apasă **+ Adaugă** pentru a crea experiențe
3. Selectează o experiență → editeaz-o în tab-ul **Editor**
4. Descarcă QR-urile dacă vrei
5. Apasă **Exportă tot** → descarci `ar-experiences.zip`

## După export

În fiecare folder `exp-X` trebuie să generezi fișierul `targets.mind` din poză, folosind compilatorul oficial:

https://hiukim.github.io/mind-ar-js-doc/tools/compile
