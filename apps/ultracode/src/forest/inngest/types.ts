/**
 * Payload for the review/triggered event.
 */
export interface ReviewTriggeredPayload {
	/**
	 * Unique identifier for the review.
	 */
	reviewId: string;

	/**
	 * Repository ID within Ultracode D1.
	 */
	repoId: string;

	/**
	 * GitHub repository owner.
	 */
	owner: string;

	/**
	 * GitHub repository name (without owner).
	 */
	repoName: string;

	/**
	 * Full repository name: "{owner}/{repo}".
	 */
	fullName: string;

	/**
	 * Default branch (usually "main").
	 */
	defaultBranch: string;

	/**
	 * Numeric pull request number; null when running against the default branch.
	 */
	pullNumber: number | null;

	/**
	 * Ultracode user ID (matches the "sub" claim in the Better Auth session).
	 */
	userId: string;

	/**
	 * GitHub access token (stored in D1) for API calls
	 */
	githubAccessToken: string;

	/**
	 * What triggered this review.
	 */
	trigger: "manual" | "scheduled";
}

/**
 * Payload for the review/progress event.
 */
export interface ReviewProgressPayload {
	/**
	 * Review ID this event describes.
	 */
	reviewId: string;

	/**
	 * One of "pending" | "in_progress" | "completed" | "failed".
	 */
	status: string;

	/**
	 * Number of findings found so far.
	 */
	findingsCount: number;

	/**
	 * Optional human-readable message (used for errors or status transitions).
	 */
	message?: string;
}

export type InngestEventName = "review/triggered" | "review/progress";
