
# Je sudý nebo lichý týden?
{
  "handler": "weekOddOrEven",
  "query_params": {},
  "stag_params": {}
}

# Je sudý nebo lichý týden a jaké předměty nemám? *
{
  "handler": "weekOddOrEven",
  "query_params": {"subjects": true},
  "stag_params": {}
}

# Informace o kvalifikační práci
{
  "handler": "thesis",
  "query_params": {},
  "stag_params": {}
}

# Informace o kvalifikační práci jiného studenta
{
  "handler": "thesis",
  "stag_params": {"osCislo": "R13908"},
  "query_params": {}
}

{
  "handler": "thesis",
  "stag_params": {"osCislo": "R16987"},
  "query_params": {}
}

# Informace o rozvrhu *
{
  "handler": "schedule",
  "stag_params": {},
  "query_params": {}
}

{
  "handler": "schedule",
  "stag_params": {},
  "query_params": {"day": "zítra"}
}

{
  "handler": "schedule",
  "stag_params": {},
  "query_params": {"day": "úterý"}
}

# Informace o předmětu *
{
  "handler": "subject",
  "stag_params": {"katedra": "KMI", "zkratka": "ALS1"},
  "query_params": {}
}
