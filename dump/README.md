How to generate a dump and later import it
--------------------------------------------

*Dump do MongoDB (ap�s fazer shutdown do DB)*
```
mongodump --dbpath XX -d local -o .
```

*Restore do MongoDB*
Dropar as collections a serem substitu�das (aten��o com a collection favorites)
```
mongorestore -d local XX
```