"""
Orchestration layer for automatic cross-platform actions
"""
import httpx
import logging
import re
from typing import Optional, List, Dict
from app.database import get_user_token, supabase

logger = logging.getLogger("CovalynceOrchestration")

def extract_jira_ticket_ids(text: str) -> List[str]:
    """Extract Jira ticket IDs from text (e.g., PROJ-123)"""
    # Common Jira ticket patterns: PROJECT-123, PROJ-456, etc.
    pattern = r'\b[A-Z]+-\d+\b'
    matches = re.findall(pattern, text)
    return list(set(matches))  # Remove duplicates

def extract_github_pr_info(pr_data: dict) -> dict:
    """Extract relevant info from GitHub PR"""
    return {
        "number": pr_data.get("number"),
        "title": pr_data.get("title", ""),
        "body": pr_data.get("body", ""),
        "merged_at": pr_data.get("merged_at"),
        "base_ref": pr_data.get("base", {}).get("ref", ""),
        "head_ref": pr_data.get("head", {}).get("ref", ""),
        "commits": pr_data.get("commits", 0),
        "author": pr_data.get("user", {}).get("login", "")
    }

async def update_jira_ticket_status(ticket_id: str, status: str, user_id: str, comment: str = None):
    """Update Jira ticket status"""
    jira_token = get_user_token(user_id, "jira")
    if not jira_token:
        logger.warning(f"No Jira token for user {user_id}")
        return False
    
    # Extract Jira instance URL from token or user settings
    # For now, assume it's stored in metadata
    from app.database import supabase
    if not supabase:
        return False
    
    try:
        jira_integration = supabase.table("user_integrations").select("metadata").eq("user_id", user_id).eq("provider", "jira").execute()
        if not jira_integration.data:
            return False
        
        jira_url = jira_integration.data[0].get("metadata", {}).get("jira_url", "")
        if not jira_url:
            return False
        
        # Update ticket status
        async with httpx.AsyncClient() as http:
            # Get current issue to find transition ID
            issue_resp = await http.get(
                f"{jira_url}/rest/api/3/issue/{ticket_id}",
                headers={
                    "Authorization": f"Bearer {jira_token}",
                    "Accept": "application/json"
                }
            )
            
            if issue_resp.status_code != 200:
                logger.error(f"Failed to get Jira issue: {issue_resp.status_code}")
                return False
            
            issue_data = issue_resp.json()
            current_status = issue_data.get("fields", {}).get("status", {}).get("name", "")
            
            # Map status names
            status_map = {
                "Dev Done": "Done",
                "Ready for QA": "In Review",
                "Completed": "Done"
            }
            target_status = status_map.get(status, status)
            
            # Get available transitions
            transitions_resp = await http.get(
                f"{jira_url}/rest/api/3/issue/{ticket_id}/transitions",
                headers={
                    "Authorization": f"Bearer {jira_token}",
                    "Accept": "application/json"
                }
            )
            
            if transitions_resp.status_code == 200:
                transitions = transitions_resp.json().get("transitions", [])
                transition_id = None
                for trans in transitions:
                    if target_status.lower() in trans.get("name", "").lower():
                        transition_id = trans.get("id")
                        break
                
                if transition_id:
                    # Execute transition
                    transition_resp = await http.post(
                        f"{jira_url}/rest/api/3/issue/{ticket_id}/transitions",
                        headers={
                            "Authorization": f"Bearer {jira_token}",
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        },
                        json={
                            "transition": {"id": transition_id}
                        }
                    )
                    
                    if transition_resp.status_code == 204:
                        # Add comment if provided
                        if comment:
                            await http.post(
                                f"{jira_url}/rest/api/3/issue/{ticket_id}/comment",
                                headers={
                                    "Authorization": f"Bearer {jira_token}",
                                    "Accept": "application/json",
                                    "Content-Type": "application/json"
                                },
                                json={
                                    "body": {
                                        "type": "doc",
                                        "version": 1,
                                        "content": [{
                                            "type": "paragraph",
                                            "content": [{"type": "text", "text": comment}]
                                        }]
                                    }
                                }
                            )
                        return True
            
            return False
    except Exception as e:
        logger.error(f"Jira update error: {e}")
        return False

async def check_story_completion(story_key: str, user_id: str) -> bool:
    """Check if all subtasks of a story are completed"""
    jira_token = get_user_token(user_id, "jira")
    if not jira_token:
        return False
    
    from app.database import supabase
    if not supabase:
        return False
    
    try:
        jira_integration = supabase.table("user_integrations").select("metadata").eq("user_id", user_id).eq("provider", "jira").execute()
        if not jira_integration.data:
            return False
        
        jira_url = jira_integration.data[0].get("metadata", {}).get("jira_url", "")
        if not jira_url:
            return False
        
        async with httpx.AsyncClient() as http:
            # Get story with subtasks
            issue_resp = await http.get(
                f"{jira_url}/rest/api/3/issue/{story_key}?fields=subtasks,status",
                headers={
                    "Authorization": f"Bearer {jira_token}",
                    "Accept": "application/json"
                }
            )
            
            if issue_resp.status_code != 200:
                return False
            
            issue_data = issue_resp.json()
            subtasks = issue_data.get("fields", {}).get("subtasks", [])
            
            if not subtasks:
                # No subtasks, check if story itself is done
                status = issue_data.get("fields", {}).get("status", {}).get("name", "")
                return "done" in status.lower() or "complete" in status.lower()
            
            # Check each subtask
            all_done = True
            for subtask in subtasks:
                subtask_key = subtask.get("key")
                subtask_resp = await http.get(
                    f"{jira_url}/rest/api/3/issue/{subtask_key}?fields=status",
                    headers={
                        "Authorization": f"Bearer {jira_token}",
                        "Accept": "application/json"
                    }
                )
                
                if subtask_resp.status_code == 200:
                    subtask_data = subtask_resp.json()
                    subtask_status = subtask_data.get("fields", {}).get("status", {}).get("name", "")
                    if "done" not in subtask_status.lower() and "complete" not in subtask_status.lower():
                        all_done = False
                        break
            
            return all_done
    except Exception as e:
        logger.error(f"Story completion check error: {e}")
        return False

async def handle_pr_merge_to_prod(pr_data: dict, user_id: str):
    """Handle PR merge to production - Update Jira tickets"""
    pr_info = extract_github_pr_info(pr_data)
    
    # Check if merged to main/master/production
    if pr_info["base_ref"] not in ["main", "master", "production", "prod"]:
        return {"status": "skipped", "reason": "Not merged to production branch"}
    
    if not pr_info.get("merged_at"):
        return {"status": "skipped", "reason": "PR not merged"}
    
    # Extract Jira ticket IDs from PR title and body
    ticket_ids = extract_jira_ticket_ids(pr_info["title"] + " " + pr_info["body"])
    
    if not ticket_ids:
        logger.info(f"No Jira tickets found in PR #{pr_info['number']}")
        return {"status": "skipped", "reason": "No Jira tickets found"}
    
    results = []
    for ticket_id in ticket_ids:
        # Update ticket status
        comment = f"PR #{pr_info['number']} merged to {pr_info['base_ref']}. Changes: {pr_info['title']}"
        success = await update_jira_ticket_status(ticket_id, "Dev Done", user_id, comment)
        
        results.append({
            "ticket_id": ticket_id,
            "updated": success
        })
        
        # Check if parent story is complete
        # Extract project and number (e.g., PROJ-123 -> PROJ)
        project = ticket_id.split("-")[0]
        
        # Try to find parent story (this would need Jira API to get parent)
        # For now, log the ticket update
        logger.info(f"Updated Jira ticket {ticket_id} for PR #{pr_info['number']}")
    
    return {
        "status": "completed",
        "pr_number": pr_info["number"],
        "tickets_updated": results
    }

async def handle_multi_merge_story_completion(user_id: str):
    """Check all stories and auto-complete if all subtasks merged"""
    from app.database import supabase
    if not supabase:
        return []
    
    # Get all stories user is tracking
    # This would be stored in a user_stories table or similar
    # For now, we'll check recent PRs and their linked stories
    
    github_token = get_user_token(user_id, "github")
    if not github_token:
        return []
    
    try:
        async with httpx.AsyncClient() as http:
            # Get recent merged PRs
            headers = {"Authorization": f"token {github_token}", "Accept": "application/vnd.github.v3+json"}
            
            # Get user's repos or org repos
            user_resp = await http.get("https://api.github.com/user", headers=headers)
            if user_resp.status_code != 200:
                return []
            
            username = user_resp.json().get("login")
            
            # Get events (simplified - in production would track specific repos)
            events_resp = await http.get(
                f"https://api.github.com/users/{username}/events",
                headers=headers
            )
            
            if events_resp.status_code != 200:
                return []
            
            events = events_resp.json()
            
            # Track stories and their completion
            story_tracking = {}
            
            for event in events[:50]:  # Check last 50 events
                if event.get("type") == "PullRequestEvent" and event.get("payload", {}).get("action") == "closed":
                    pr = event.get("payload", {}).get("pull_request", {})
                    if pr.get("merged"):
                        pr_info = extract_github_pr_info(pr)
                        ticket_ids = extract_jira_ticket_ids(pr_info["title"] + " " + pr_info["body"])
                        
                        for ticket_id in ticket_ids:
                            # Check if ticket is part of a story
                            # In production, would query Jira for parent story
                            # For now, track completion per ticket
                            if ticket_id not in story_tracking:
                                story_tracking[ticket_id] = {
                                    "ticket_id": ticket_id,
                                    "prs_merged": [],
                                    "completed": False
                                }
                            
                            story_tracking[ticket_id]["prs_merged"].append(pr_info["number"])
                            
                            # Check if story is complete
                            is_complete = await check_story_completion(ticket_id, user_id)
                            if is_complete and not story_tracking[ticket_id]["completed"]:
                                story_tracking[ticket_id]["completed"] = True
                                # Update story status
                                await update_jira_ticket_status(
                                    ticket_id,
                                    "Dev Complete",
                                    user_id,
                                    f"All related PRs merged. Story complete."
                                )
            
            return list(story_tracking.values())
    except Exception as e:
        logger.error(f"Multi-merge story completion error: {e}")
        return []

