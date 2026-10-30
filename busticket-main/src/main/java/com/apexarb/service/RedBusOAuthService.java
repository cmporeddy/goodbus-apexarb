package com.apexarb.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import oauth.signpost.OAuthConsumer;
import oauth.signpost.commonshttp.CommonsHttpOAuthConsumer;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import com.apexarb.model.BlockTicketRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class RedBusOAuthService {

    private static final Logger log = LoggerFactory.getLogger(RedBusOAuthService.class);

    private static final String CB_NAME = "externalApiCB";
    private static final String RETRY_NAME = "externalApiRetry";
    private static final String FALLBACK_JSON = "{\"success\":false,\"message\":\"External bus API is temporarily unavailable. Please try again shortly.\"}";

    @Value("${redbus.clientKey}")
    private String clientKey;

    @Value("${redbus.clientSecret}")
    private String clientSecret;

    private java.net.http.HttpClient httpClient;
    private WebClient webClient;
    private final ObjectMapper objectMapper;

    @PostConstruct
    public void init() {
        httpClient = java.net.http.HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .version(java.net.http.HttpClient.Version.HTTP_2)
                .build();

        ConnectionProvider provider = ConnectionProvider.builder("redbus-provider")
                .maxConnections(200)
                .pendingAcquireTimeout(Duration.ofSeconds(10))
                .maxIdleTime(Duration.ofSeconds(20))
                .build();

        HttpClient reactorHttpClient = HttpClient.create(provider)
                .responseTimeout(Duration.ofSeconds(14));

        webClient = WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(reactorHttpClient))
                .build();
    }

    // --- SYNCHRONOUS METHODS ---

    @CircuitBreaker(name = CB_NAME, fallbackMethod = "fallbackResponse")
    @Retry(name = RETRY_NAME, fallbackMethod = "fallbackResponse")
    public ResponseEntity<String> callRedBusApi(String url) throws Exception {
        HttpRequest request = buildSignedGetRequest(url);
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return ResponseEntity.status(response.statusCode()).body(response.body());
    }

    @CircuitBreaker(name = CB_NAME, fallbackMethod = "fallbackResponse")
    @Retry(name = RETRY_NAME, fallbackMethod = "fallbackResponse")
    public ResponseEntity<String> callRedBusApiPost(String url) throws Exception {
        HttpRequest request = buildSignedPostRequest(url, null);
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return ResponseEntity.status(response.statusCode()).body(response.body());
    }

    @CircuitBreaker(name = CB_NAME, fallbackMethod = "fallbackResponseWithBody")
    @Retry(name = RETRY_NAME, fallbackMethod = "fallbackResponseWithBody")
    public ResponseEntity<String> callRedBusApiPostReq(String url, BlockTicketRequest blockTicketRequest)
            throws Exception {
        HttpRequest request = buildSignedPostRequest(url, blockTicketRequest);
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return ResponseEntity.status(response.statusCode()).body(response.body());
    }

    // // --- ASYNCHRONOUS NON-BLOCKING METHODS (CompletableFuture) ---

    // public CompletableFuture<ResponseEntity<String>> callRedBusApiAsync(String
    // url) {
    // try {
    // HttpRequest request = buildSignedGetRequest(url);
    // // Non-blocking NIO call over HTTP
    // return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
    // .thenApply(response ->
    // ResponseEntity.status(response.statusCode()).body(response.body()))
    // .exceptionally(ex -> {
    // log.error("Async GET request failed: {}", ex.getMessage());
    // return
    // ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(FALLBACK_JSON);
    // });
    // } catch (Exception e) {
    // log.error("Failed to build async GET request: {}", e.getMessage());
    // return CompletableFuture.completedFuture(
    // ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(FALLBACK_JSON));
    // }
    // }

    // public CompletableFuture<ResponseEntity<String>>
    // callRedBusApiPostAsync(String url) {
    // try {
    // HttpRequest request = buildSignedPostRequest(url, null);
    // return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
    // .thenApply(response ->
    // ResponseEntity.status(response.statusCode()).body(response.body()))
    // .exceptionally(ex -> {
    // log.error("Async POST request failed: {}", ex.getMessage());
    // return
    // ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(FALLBACK_JSON);
    // });
    // } catch (Exception e) {
    // log.error("Failed to build async POST request: {}", e.getMessage());
    // return CompletableFuture.completedFuture(
    // ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(FALLBACK_JSON));
    // }
    // }

    // public CompletableFuture<ResponseEntity<String>>
    // callRedBusApiPostReqAsync(String url,
    // BlockTicketRequest blockTicketRequest) {
    // try {
    // HttpRequest request = buildSignedPostRequest(url, blockTicketRequest);
    // return httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
    // .thenApply(response ->
    // ResponseEntity.status(response.statusCode()).body(response.body()))
    // .exceptionally(ex -> {
    // log.error("Async POST with body request failed: {}", ex.getMessage());
    // return
    // ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(FALLBACK_JSON);
    // });
    // } catch (Exception e) {
    // log.error("Failed to build async POST with body request: {}",
    // e.getMessage());
    // return CompletableFuture.completedFuture(
    // ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(FALLBACK_JSON));
    // }
    // }

    // // --- REACTIVE WEBCLIENT METHODS (Mono / Flux) ---

    // /**
    // * Fully reactive WebClient fetch tailored for Dashboard data extraction.
    // * Extracts OAuth 1.0 headers efficiently and funnels them into Spring
    // * WebClient.
    // */
    // public Mono<ResponseEntity<String>> callRedBusApiReactive(String url) {
    // return Mono.fromCallable(() -> {
    // // Generate OAuth1 signature headers using standard Signpost library
    // OAuthConsumer consumer = new CommonsHttpOAuthConsumer(clientKey,
    // clientSecret);
    // HttpGet dummyRequest = new HttpGet(url);
    // consumer.sign(dummyRequest);
    // org.apache.http.Header authHeader =
    // dummyRequest.getFirstHeader("Authorization");
    // if (authHeader == null) {
    // throw new IllegalStateException("OAuth signing produced no Authorization
    // header for url: " + url);
    // }
    // return authHeader.getValue();
    // })
    // .flatMap(authHeader -> webClient.get()
    // .uri(url)
    // .header("Authorization", authHeader)
    // .exchangeToMono(response -> response.toEntity(String.class))
    // .timeout(Duration.ofSeconds(14)))
    // .onErrorResume(ex -> {
    // log.error("Reactive API call failed: {}", ex.getMessage());
    // return
    // Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(FALLBACK_JSON));
    // });
    // }

    // // --- FALLBACK METHODS (Resilience4j requirement: same signature +
    // Throwable) ---

    // public ResponseEntity<String> fallbackResponse(String url, Throwable ex) {
    // log.error("External API unavailable. Reason: {}", ex.getMessage());
    // return
    // ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(FALLBACK_JSON);
    // }

    // public ResponseEntity<String> fallbackResponseWithBody(String url,
    // BlockTicketRequest body, Throwable ex) {
    // log.error("External API unavailable. Reason: {}", ex.getMessage());
    // return
    // ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(FALLBACK_JSON);
    // }

    // // --- INTERNAL HELPERS FOR OAUTH 1.0 SIGNING ---

    private HttpRequest buildSignedGetRequest(String url) throws Exception {
        OAuthConsumer consumer = new CommonsHttpOAuthConsumer(clientKey,
                clientSecret);

        // Use Apache HttpGet just as a vessel to generate OAuth headers
        HttpGet dummyRequest = new HttpGet(url);
        consumer.sign(dummyRequest);

        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .GET();

        for (org.apache.http.Header header : dummyRequest.getAllHeaders()) {
            builder.header(header.getName(), header.getValue());
        }
        return builder.build();
    }

    private HttpRequest buildSignedPostRequest(String url, BlockTicketRequest blockTicketRequest) throws Exception {
        OAuthConsumer consumer = new CommonsHttpOAuthConsumer(clientKey,
                clientSecret);

        HttpPost dummyRequest = new HttpPost(url);
        HttpRequest.BodyPublisher bodyPublisher;

        if (blockTicketRequest != null) {
            String json = objectMapper.writeValueAsString(blockTicketRequest);
            bodyPublisher = HttpRequest.BodyPublishers.ofString(json);
            dummyRequest.setHeader("Content-Type", "application/json");
        } else {
            bodyPublisher = HttpRequest.BodyPublishers.noBody();
        }

        consumer.sign(dummyRequest); // Generates OAuth headers into dummyRequest

        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(15))
                .POST(bodyPublisher);

        for (org.apache.http.Header header : dummyRequest.getAllHeaders()) {
            builder.header(header.getName(), header.getValue());
        }
        return builder.build();
    }
}
