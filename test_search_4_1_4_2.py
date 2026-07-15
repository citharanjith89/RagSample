"""
Test script for Phase 4.1 (Query Processing + RBAC Filtering)
and Phase 4.2 (Semantic, Keyword & Hybrid Search).
"""

import requests

BASE_URL = "http://localhost:8000"

QUERY = "leave policy"  # <-- change this to something you know exists in your docs

TEST_USERS = [
    {"email": "admin@company.com", "password": "admin1234", "role": "admin", "register": False},
    {"email": "test.employee@company.com", "password": "TestPass123!", "role": "employee", "register": True},
    {"email": "test.manager@company.com", "password": "TestPass123!", "role": "manager", "register": True},
]


def register(session, user):
    payload = {"email": user["email"], "password": user["password"], "role": user["role"]}
    r = session.post(f"{BASE_URL}/api/auth/register", json=payload)
    if r.status_code in (200, 201):
        print(f"  [registered] {user['email']}")
    elif r.status_code in (400, 409):
        print(f"  [already exists] {user['email']}")
    else:
        print(f"  [register WARNING] {user['email']} -> {r.status_code}: {r.text[:200]}")


def login(session, user):
    payload = {"email": user["email"], "password": user["password"]}
    r = session.post(f"{BASE_URL}/api/auth/login", json=payload)
    if r.status_code != 200:
        print(f"  [login FAILED] {user['email']} -> {r.status_code}: {r.text[:200]}")
        return None
    data = r.json()
    token = data.get("access_token") or data.get("token")
    if not token:
        print(f"  [login WARNING] no token found in response keys: {list(data.keys())}")
        return None
    print(f"  [login OK] {user['email']} (role={user['role']})")
    return token


def run_search(session, token, query):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"query": query, "limit": 10}
    r = session.post(f"{BASE_URL}/api/search", json=payload, headers=headers)
    if r.status_code != 200:
        print(f"  [search FAILED] {r.status_code}: {r.text[:300]}")
        return None
    return r.json()


def summarize(result, role):
    if result is None:
        return
    results = result.get("results", [])
    print(f"\n--- {role.upper()} ---")
    print(f"  has_answer: {result.get('has_answer')}")
    print(f"  normalized_query: {result.get('normalized_query')}")
    print(f"  result count: {len(results)}")

    if not results:
        print("  (no results)")
        return

    search_types = {}
    access_levels = {}
    for item in results:
        st = item.get("search_type", "?")
        al = item.get("access_level", "?")
        search_types[st] = search_types.get(st, 0) + 1
        access_levels[al] = access_levels.get(al, 0) + 1

    print(f"  search_type breakdown: {search_types}")
    print(f"  access_level breakdown: {access_levels}")
    print("  top result:")
    top = results[0]
    print(f"    doc: {top.get('filename')} | access_level: {top.get('access_level')} | "
          f"combined_score: {top.get('combined_score'):.4f} | search_type: {top.get('search_type')}")


def main():
    print(f"Testing query: {QUERY!r}\n")
    print("=== Setting up accounts ===")
    session = requests.Session()

    tokens = {}
    for user in TEST_USERS:
        if user["register"]:
            register(session, user)
        token = login(session, user)
        if token:
            tokens[user["role"]] = token

    print("\n=== Running search per role ===")
    results_by_role = {}
    for role, token in tokens.items():
        result = run_search(session, token, QUERY)
        results_by_role[role] = result

    print("\n=== SUMMARY ===")
    for role, result in results_by_role.items():
        summarize(result, role)

    print("\n=== RBAC SANITY CHECK ===")
    if "admin" in results_by_role and "employee" in results_by_role:
        admin_count = len(results_by_role["admin"].get("results", [])) if results_by_role["admin"] else 0
        emp_count = len(results_by_role["employee"].get("results", [])) if results_by_role["employee"] else 0
        if emp_count <= admin_count:
            print(f"  OK-ish: employee ({emp_count}) <= admin ({admin_count}) result count.")
            print("  (Not proof by itself - also check access_level breakdown above.")
            print("   Employee should NEVER see 'confidential' or 'restricted' access_level docs.)")
        else:
            print(f"  WARNING: employee ({emp_count}) > admin ({admin_count}). RBAC filter may be broken.")
    else:
        print("  Could not compare - one of admin/employee logins failed above.")


if __name__ == "__main__":
    main()
