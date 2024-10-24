import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController


@RestController
class RootController {

    @GetMapping("/health")
    fun root(): String {
        return "Booking service is up and running"
    }
}